const express = require("express");
const request = require("supertest");

jest.mock("../src/config/postgres", () => ({
  query: jest.fn(),
}));

jest.mock("../src/middleware/authMiddleware", () =>
  (req, res, next) => {
    req.user = { id: "test-user-123" };
    next();
  }
);

jest.mock("../src/middleware/loadCurrentUser", () =>
  (req, res, next) => {
    next();
  }
);

const pool = require("../src/config/postgres");
const fileRoutes = require("../src/routes/fileRoutes");

describe("File API Content Negotiation", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use("/api/v1/files", fileRoutes);

    pool.query.mockImplementation((query) => {
      if (query.includes("FROM files f") && !query.includes("WHERE f.id = $1")) {
        return Promise.resolve({
          rows: [{
            id: "file-123",
            original_name: "example.txt",
            size_bytes: 100,
            created_at: "2026-10-20T10:00:00.000Z",
          }],
        });
      }
      return Promise.resolve({
        rows: [{
          id: "file-123",
          owner_id: "test-user-123",
          original_name: "example.txt",
          size_bytes: 100,
          checksum: "abc123",
          requester_role: "user",
          granted_permission: "read",
        }],
      });
    });
  });

  test("GET /api/v1/files returns JSON", async () => {
    const response = await request(app)
      .get("/api/v1/files")
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(
      /application\/json/
    );
    expect(response.body.success).toBe(true);
    expect(response.body.count).toBe(1);
  });

  test("GET /api/v1/files returns XML", async () => {
    const response = await request(app)
      .get("/api/v1/files")
      .set("Accept", "application/xml");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(
      /application\/xml/
    );
    expect(response.text).toContain("<response>");
    expect(response.text).toContain("<success>true</success>");
  });

  test("GET /api/v1/files/:id returns JSON", async () => {
    const response = await request(app)
      .get("/api/v1/files/file-123")
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(
      /application\/json/
    );
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe("file-123");
  });

  test("GET /api/v1/files/:id returns XML", async () => {
    const response = await request(app)
      .get("/api/v1/files/file-123")
      .set("Accept", "application/xml");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(
      /application\/xml/
    );
    expect(response.text).toContain("<response>");
    expect(response.text).toContain("<success>true</success>");
    expect(response.text).toContain("<id>file-123</id>");
  });

  test("file listing includes private cache policy", async () => {
    const response = await request(app)
      .get("/api/v1/files")
      .set("Accept", "application/json");

    expect(response.headers["cache-control"]).toContain("private");
    expect(response.headers["cache-control"]).toContain("no-cache");
  });

  test("file metadata includes an ETag", async () => {
    const response = await request(app)
      .get("/api/v1/files/file-123")
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(response.headers.etag).toBeDefined();
  });

  test("file metadata returns 304 when If-None-Match matches ETag", async () => {
    const initialResponse = await request(app)
      .get("/api/v1/files/file-123")
      .set("Accept", "application/json");

    expect(initialResponse.status).toBe(200);

    const etag = initialResponse.headers.etag;
    expect(etag).toBeDefined();

    const cachedResponse = await request(app)
      .get("/api/v1/files/file-123")
      .set("Accept", "application/json")
      .set("If-None-Match", etag);

    expect(cachedResponse.status).toBe(304);
    expect(cachedResponse.text).toBe("");
  });
});
