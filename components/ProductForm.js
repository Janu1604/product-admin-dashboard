'use client';

import { useState } from 'react';

const emptyForm = {
  title: '',
  category: '',
  price: '',
  stock: '',
  rating: '',
  description: '',
  thumbnail: '',
};

export default function ProductForm({ initial, categories, onSubmit, submitLabel = 'Save' }) {
  const [form, setForm] = useState({ ...emptyForm, ...initial });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function validate() {
    const e = {};
    if (!form.title || form.title.trim().length < 2) e.title = 'Title must be at least 2 characters.';
    if (!form.category) e.category = 'Please select a category.';
    if (form.price === '' || isNaN(form.price) || Number(form.price) < 0)
      e.price = 'Enter a valid price.';
    if (form.stock === '' || isNaN(form.stock) || Number(form.stock) < 0)
      e.stock = 'Enter a valid stock number.';
    if (form.rating !== '' && (isNaN(form.rating) || Number(form.rating) < 0 || Number(form.rating) > 5))
      e.rating = 'Rating must be between 0 and 5.';
    if (!form.description || form.description.trim().length < 5)
      e.description = 'Description must be at least 5 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return; // stops "click Save many times" from sending multiple requests
    setSubmitError('');
    if (!validate()) return;

    setSaving(true);
    try {
      await onSubmit({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        rating: form.rating === '' ? 0 : Number(form.rating),
      });
    } catch (err) {
      setSubmitError(err.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl bg-white p-4 sm:p-6 rounded-lg border">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={form.title}
          onChange={(e) => handleChange('title', e.target.value)}
        />
        {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={form.category}
          onChange={(e) => handleChange('category', e.target.value)}
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Price ($)</label>
          <input
            type="number"
            step="0.01"
            className="w-full border rounded px-3 py-2"
            value={form.price}
            onChange={(e) => handleChange('price', e.target.value)}
          />
          {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Stock</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={form.stock}
            onChange={(e) => handleChange('stock', e.target.value)}
          />
          {errors.stock && <p className="text-xs text-red-600 mt-1">{errors.stock}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Rating (0-5)</label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="5"
          className="w-full border rounded px-3 py-2"
          value={form.rating}
          onChange={(e) => handleChange('rating', e.target.value)}
        />
        {errors.rating && <p className="text-xs text-red-600 mt-1">{errors.rating}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Thumbnail URL</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={form.thumbnail}
          onChange={(e) => handleChange('thumbnail', e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          rows={4}
          className="w-full border rounded px-3 py-2"
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />
        {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
      </div>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
