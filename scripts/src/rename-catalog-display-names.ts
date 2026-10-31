import { createHash } from 'node:crypto';
import { getMongoDatabase, closeMongoDatabase } from '@workspace/brew-server/mongo';
import { getUncachableStripeClient, StripeConfigurationError } from '@workspace/brew-server/stripe-client';

const displayNames: Record<string, string> = {
  konga: 'Ethiopian 1',
  webanchi: 'Ethiopian 2',
  'caramel-candy': 'Caramel',
  'brazil-samba': 'Brazil',
};
const brandTextFields = [
  'description', 'why', 'descriptionAr', 'whyAr', 'detailDescription',
  'detailDescriptionAr', 'origin', 'originAr',
];

function replaceStoreName(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return value.replace(/\bBrew\s+Logic\b/gi, (match) =>
    match === match.toUpperCase() ? 'BREW' : 'Brew',
  );
}

function stripeProductId(catalogId: string) {
  const identity = createHash('sha256').update(`product:${catalogId}`).digest('hex').slice(0, 32);
  return `brew_logic_${identity}`;
}

async function main() {
  const db = await getMongoDatabase();
  try {
    const products = db.collection('products');
    const targetIds = Object.keys(displayNames);
    const catalogRows = await products.find({ id: { $in: targetIds } }).toArray();
    if (catalogRows.length !== targetIds.length || catalogRows.some((item) => item.category !== 'bean')) {
      throw new Error('Catalog precondition failed');
    }

    const previousNames = new Map<string, string>();
    for (const row of catalogRows) {
      const id = String(row.id);
      const name = String(displayNames[id]);
      const duplicate = await products.findOne({ id: { $ne: id }, name });
      if (duplicate) throw new Error('Catalog name already exists');
      previousNames.set(String(row.name), name);
    }

    let changedProducts = 0;
    for (const row of catalogRows) {
      const id = String(row.id);
      const fields: Record<string, unknown> = {};
      if (row.name !== displayNames[id]) fields.name = displayNames[id];
      for (const field of brandTextFields) {
        const value = replaceStoreName(row[field]);
        if (value !== row[field]) fields[field] = value;
      }
      if (Object.keys(fields).length) {
        const result = await products.updateOne({ _id: row._id }, { $set: { ...fields, updatedAt: new Date() } });
        changedProducts += result.modifiedCount;
      }
    }

    const bundles = db.collection('bundles');
    let changedBundles = 0;
    for (const bundle of await bundles.find({}).toArray()) {
      const oldItems = Array.isArray(bundle.items) ? bundle.items : [];
      const items = oldItems.map((item) => typeof item === 'string' ? (previousNames.get(item) ?? item) : item);
      const fields: Record<string, unknown> = {};
      if (JSON.stringify(oldItems) !== JSON.stringify(items)) fields.items = items;
      for (const field of ['note', 'noteAr', 'description', 'descriptionAr']) {
        const value = replaceStoreName(bundle[field]);
        if (value !== bundle[field]) fields[field] = value;
      }
      if (Object.keys(fields).length) {
        const result = await bundles.updateOne({ _id: bundle._id }, { $set: { ...fields, updatedAt: new Date() } });
        changedBundles += result.modifiedCount;
      }
    }

    const orderCollection = db.collection('orders');
    let changedOrderLines = 0;
    const orders = await orderCollection.find({ 'lines.id': { $in: targetIds } }).toArray();
    for (const order of orders) {
      if (!Array.isArray(order.lines)) continue;
      let changed = 0;
      const lines = order.lines.map((line: Record<string, unknown>) => {
        const name = displayNames[String(line.id)];
        if (name && line.name !== name) {
          changed += 1;
          return { ...line, name };
        }
        return line;
      });
      if (changed) {
        await orderCollection.updateOne({ _id: order._id }, { $set: { lines } });
        changedOrderLines += changed;
      }
    }

    const stripe = await getUncachableStripeClient();
    let changedStripeProducts = 0;
    for (const [id, name] of Object.entries(displayNames)) {
      let product;
      try {
        product = await stripe.products.retrieve(stripeProductId(id));
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'resource_missing') continue;
        throw error;
      }
      if (product.deleted || product.livemode || product.metadata.app !== 'brew-logic' || product.metadata.brewCatalogId !== id) {
        throw new Error('Stripe product ownership check failed');
      }
      if (product.name !== name) {
        await stripe.products.update(product.id, { name });
        changedStripeProducts += 1;
      }
    }

    console.log(`Updated ${changedProducts} product records, ${changedBundles} bundles, ${changedOrderLines} order lines, and ${changedStripeProducts} Stripe test product names.`);
  } finally {
    await closeMongoDatabase();
  }
}

main().catch((error) => {
  console.error(error instanceof StripeConfigurationError
    ? 'Catalog and order updates completed, but Stripe test checkout is not configured.'
    : 'Catalog display-name update failed.');
  process.exitCode = 1;
});
