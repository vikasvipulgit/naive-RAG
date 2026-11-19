const BASE_URL = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async getSettings() {
    const res = await fetch(`${BASE_URL}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settings) {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async getDocuments() {
    const res = await fetch(`${BASE_URL}/documents`);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async uploadDocuments(files) {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    const res = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload documents');
    }
    return res.json();
  },

  async loadSampleDocuments() {
    const res = await fetch(`${BASE_URL}/documents/load-samples`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to load sample documents');
    return res.json();
  },

  async deleteDocument(docId) {
    const res = await fetch(`${BASE_URL}/documents/${docId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
  },

  async clearAllDocuments() {
    const res = await fetch(`${BASE_URL}/documents`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to clear documents');
    return res.json();
  },

  async getAllChunks() {
    const res = await fetch(`${BASE_URL}/chunks`);
    if (!res.ok) throw new Error('Failed to fetch chunks');
    return res.json();
  },

  async retrieveChunks(query, topK, similarityThreshold) {
    const res = await fetch(`${BASE_URL}/retrieve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        top_k: topK,
        similarity_threshold: similarityThreshold,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Retrieval failed');
    }
    return res.json();
  },

  async queryRag(query, topK, similarityThreshold, compareWithoutRag = false) {
    const res = await fetch(`${BASE_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        top_k: topK,
        similarity_threshold: similarityThreshold,
        compare_without_rag: compareWithoutRag,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Query failed');
    }
    return res.json();
  },
};

