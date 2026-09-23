// DummyJSON's add/edit/delete endpoints return realistic-looking responses
// but never actually persist anything server-side — refreshing or
// navigating away brings back the original data. To make the app actually
// *show* the change (as the assignment asks), we keep a small local
// "overrides" record in localStorage and merge it into whatever the API
// returns, for the rest of this browser session.
//
// Shape: { added: Product[], edited: { [id]: partialProduct }, deletedIds: number[] }

const KEY = 'padb_overrides';

function read() {
  if (typeof window === 'undefined') return { added: [], edited: {}, deletedIds: [] };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { added: [], edited: {}, deletedIds: [] };
  } catch {
    return { added: [], edited: {}, deletedIds: [] };
  }
}

function write(data) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function addProductOverride(product) {
  const data = read();
  // De-dupe by id: DummyJSON's demo API tends to hand back the same
  // placeholder id for every new product, so a later add should replace
  // an earlier one with the same id rather than create a duplicate.
  data.added = [product, ...data.added.filter((p) => Number(p.id) !== Number(product.id))];
  write(data);
}

export function editProductOverride(id, changes) {
  const data = read();
  const numId = Number(id);
  const addedIndex = data.added.findIndex((p) => Number(p.id) === numId);
  if (addedIndex !== -1) {
    // Editing a product that only exists locally (was added this session)
    data.added[addedIndex] = { ...data.added[addedIndex], ...changes };
  } else {
    data.edited[id] = { ...(data.edited[id] || {}), ...changes };
  }
  write(data);
}

export function deleteProductOverride(id) {
  const data = read();
  const numId = Number(id);
  data.added = data.added.filter((p) => Number(p.id) !== numId);
  delete data.edited[id];
  if (!data.deletedIds.includes(numId)) data.deletedIds.push(numId);
  write(data);
}

export function getAddedProductById(id) {
  const data = read();
  return data.added.find((p) => Number(p.id) === Number(id)) || null;
}

export function getEditedFieldsById(id) {
  const data = read();
  return data.edited[id] || null;
}

export function isDeleted(id) {
  const data = read();
  return data.deletedIds.includes(Number(id));
}

// Merges overrides into a page of products fetched from the API.
// `includeAdded` should only be true for the default, unfiltered page 1
// view — we can't know whether a locally-added product would actually
// match a given search/category/sort, so we only surface it there.
export function applyOverridesToList(products, total, { includeAdded = false } = {}) {
  const data = read();

  let list = products
    .filter((p) => !data.deletedIds.includes(Number(p.id)))
    .map((p) => (data.edited[p.id] ? { ...p, ...data.edited[p.id] } : p));

  let adjustedTotal = Math.max(0, total - data.deletedIds.length);

  if (includeAdded && data.added.length > 0) {
    const existingIds = new Set(list.map((p) => Number(p.id)));
    const newOnes = data.added.filter((p) => !existingIds.has(Number(p.id)));
    list = [...newOnes, ...list];
    adjustedTotal += newOnes.length;
  }

  return { products: list, total: adjustedTotal };
}

export function applyOverridesToProduct(product) {
  if (!product) return product;
  const data = read();
  return data.edited[product.id] ? { ...product, ...data.edited[product.id] } : product;
}
