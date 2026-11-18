const request = require("supertest");
const express = require("express");

jest.mock("../src/config/postgres", () => ({
  query: jest.fn(),
}));

const pool = require("../src/config/postgres");
const fileController = require("../src/controllers/fileController");

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.user = { id: "user-123", role: "user" };
  next();
});
app.get("/api/v1/files", fileController.getUserFiles);

describe("File Pagination API", () => {
  const sampleFiles = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      original_name: "first.txt",
      size_bytes: 100,
      created_at: "2026-10-20T10:00:00.000Z",
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      original_name: "second.txt",
      size_bytes: 200,
      created_at: "2026-10-19T10:00:00.000Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("uses the default limit of 10", async () => {
    pool.query.mockResolvedValue({ rows: [sampleFiles[0]] });
    const response = await request(app).get("/api/v1/files");
    expect(response.status).toBe(200);
    expect(pool.query.mock.calls[0][1]).toEqual(["user-123", 11]);
    expect(response.body.count).toBe(1);
    expect(response.body.pagination.limit).toBe(10);
  });

  test("accepts a custom limit", async () => {
    pool.query.mockResolvedValue({ rows: [sampleFiles[0]] });
    const response = await request(app).get("/api/v1/files?limit=5");
    expect(response.status).toBe(200);
    expect(pool.query.mock.calls[0][1]).toEqual(["user-123", 6]);
    expect(response.body.pagination.limit).toBe(5);
  });

  test("returns a next-page link when more files exist", async () => {
    pool.query.mockResolvedValue({ rows: sampleFiles });
    const response = await request(app).get("/api/v1/files?limit=1");
    expect(response.status).toBe(200);
    expect(response.body.pagination.hasMore).toBe(true);
    expect(response.body.pagination.nextCursor).toBeTruthy();
    expect(response.body.links.next).toContain("/api/v1/files?");
    expect(response.body.links.next).toContain("limit=1");
    expect(response.body.links.next).toContain("cursor=");
  });

  test.each(["0", "101", "abc"])("rejects invalid limit %s", async (limit) => {
    const response = await request(app).get(`/api/v1/files?limit=${limit}`);
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("passes the supplied cursor into the SQL query", async () => {
    const cursor = Buffer.from(JSON.stringify({
      createdAt: "2026-10-20T10:00:00.000Z",
      id: sampleFiles[0].id,
    })).toString("base64url");
    pool.query.mockResolvedValue({ rows: [sampleFiles[1]] });
    const response = await request(app).get(`/api/v1/files?cursor=${encodeURIComponent(cursor)}`);
    expect(response.status).toBe(200);
    expect(pool.query.mock.calls[0][1]).toEqual([
      "user-123",
      "2026-10-20T10:00:00.000Z",
      sampleFiles[0].id,
      11,
    ]);
  });

  test("rejects an invalid cursor", async () => {
    const response = await request(app).get("/api/v1/files?cursor=invalid");
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_CURSOR");
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("returns a null next link when there are no more files", async () => {
    pool.query.mockResolvedValue({ rows: [sampleFiles[0]] });
    const response = await request(app).get("/api/v1/files");
    expect(response.status).toBe(200);
    expect(response.body.links.next).toBeNull();
  });
});
