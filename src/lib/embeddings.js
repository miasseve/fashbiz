// Embedding generation and similarity search using OpenAI embeddings + MongoDB Atlas Vector Search

import OpenAI from "openai";
import mongoose from "mongoose";
import dbConnect from "./db";
import ApprovedProduct from "../models/ApprovedProduct";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Must match the numDimensions in your Atlas Vector Search index
const EMBEDDING_DIMENSIONS = 256;

// Name of the vector search index created in Atlas UI
const VECTOR_INDEX_NAME = "approved_product_embedding_index";

/**
 * Build a text representation of a product for embedding
 */
export function buildEmbeddingText(product) {
  const parts = [
    product.title,
    product.brand,
    product.category,
    product.subcategory,
    Array.isArray(product.color) ? product.color.join(", ") : product.color,
    Array.isArray(product.fabric) ? product.fabric.join(", ") : product.fabric,
    product.description,
    product.condition_notes,
  ].filter(Boolean);

  return parts.join(" | ");
}

/**
 * Generate an embedding vector using OpenAI text-embedding-3-small
 */
export async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return response.data[0].embedding;
}

/**
 * Retrieve the top-K most similar approved products using Atlas Vector Search.
 *
 * Atlas handles the HNSW index scan inside the database — no vectors are
 * pulled into Node.js memory. Scales to millions of documents at the same speed.
 *
 * Priority: same store results are boosted in the re-ranking step after Atlas
 * returns its top candidates.
 *
 * @param {string} queryText  - text to find similar products for
 * @param {string} storeId    - current merchant's store ID (null for guests)
 * @param {string} category   - optional category pre-filter
 * @param {number} topK       - final number of results to return (default 5)
 */
export async function retrieveSimilarProducts(
  queryText,
  storeId,
  category = null,
  topK = 5
) {
  await dbConnect();

  const queryEmbedding = await generateEmbedding(queryText);

  // Ask Atlas for more candidates than topK so we have room to re-rank
  // by store priority without missing relevant results.
  const numCandidates = Math.max(topK * 10, 50);

  // Optional pre-filter pushed into the index (runs before vector scoring)
  const preFilter = {};
  if (category) preFilter["approvedOutput.category"] = category;

  const pipeline = [
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates,
        limit: numCandidates, // return candidates, we slice to topK after boosting
        ...(Object.keys(preFilter).length > 0 && { filter: preFilter }),
      },
    },
    {
      // Atlas injects the cosine similarity score as vectorSearchScore metadata
      $addFields: {
        vectorScore: { $meta: "vectorSearchScore" },
        sameStore: storeId
          ? { $eq: ["$storeId", new mongoose.Types.ObjectId(storeId)] }
          : false,
      },
    },
    {
      // Boost same-store results by 0.1 — identical logic to the old manual boost
      $addFields: {
        finalScore: {
          $add: [
            "$vectorScore",
            { $cond: ["$sameStore", 0.1, 0] },
          ],
        },
      },
    },
    { $sort: { finalScore: -1 } },
    { $limit: topK },
    {
      $project: {
        _id: 0,
        score: "$finalScore",
        similarity: "$vectorScore",
        product: "$approvedOutput",
        sameStore: 1,
      },
    },
  ];

  const results = await ApprovedProduct.aggregate(pipeline);
  return results;
}

/**
 * Store an embedding for an approved product
 */
export async function storeProductEmbedding(approvedProductId, product) {
  const text = buildEmbeddingText(product);
  const embedding = await generateEmbedding(text);

  await ApprovedProduct.findByIdAndUpdate(approvedProductId, {
    embedding,
    embeddingText: text,
  });

  return { text, embeddingLength: embedding.length };
}
