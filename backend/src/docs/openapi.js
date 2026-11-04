const openapiSpecification = {
  openapi: "3.0.3",

  info: {
    title: "SecureCloud API",
    version: "1.0.0",
    description:
      "API documentation for SecureCloud authentication and secure file management.",
  },

  servers: [
    {
      url: "/",
      description: "Current server",
    },
  ],

  tags: [
    {
      name: "Health",
      description: "Backend health checks",
    },
    {
      name: "Authentication",
      description: "User registration and authentication",
    },
    {
      name: "Files",
      description: "Secure file management and integrity verification",
    },
  ],

  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check backend health",
        responses: {
          200: {
            description: "Backend is running",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    message: {
                      type: "string",
                      example: "SecureCloud backend is running",
                    },
                    timestamp: {
                      type: "string",
                      format: "date-time",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                additionalProperties: false,
                properties: {
                  name: {
                    type: "string",
                    minLength: 1,
                    maxLength: 100,
                  },
                  email: {
                    type: "string",
                    format: "email",
                    maxLength: 255,
                  },
                  password: {
                    type: "string",
                    minLength: 8,
                    maxLength: 72,
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Registration successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    message: {
                      type: "string",
                      example: "Registration successful",
                    },
                    data: {
                      type: "object",
                      properties: {
                        id: {
                          type: "string",
                          format: "uuid",
                        },
                        name: {
                          type: "string",
                        },
                        email: {
                          type: "string",
                          format: "email",
                        },
                        role: {
                          type: "string",
                        },
                        created_at: {
                          type: "string",
                          format: "date-time",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          409: {
            description: "Email is already registered",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Authenticate a user and obtain a JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                additionalProperties: false,
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    maxLength: 255,
                  },
                  password: {
                    type: "string",
                    minLength: 1,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    message: {
                      type: "string",
                      example: "Login successful",
                    },
                    data: {
                      type: "object",
                      properties: {
                        token: {
                          type: "string",
                          description: "JWT authentication token",
                        },
                        user: {
                          type: "object",
                          properties: {
                            id: {
                              type: "string",
                              format: "uuid",
                            },
                            name: {
                              type: "string",
                            },
                            email: {
                              type: "string",
                              format: "email",
                            },
                            role: {
                              type: "string",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          401: {
            description: "Invalid credentials or token",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          403: {
            description: "Account is inactive",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/files": {
      get: {
        tags: ["Files"],
        summary: "List files belonging to the authenticated user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Files retrieved successfully",
          },
          401: {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },

      post: {
        tags: ["Files"],
        summary: "Create file metadata",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "originalName",
                  "storageKey",
                  "sizeBytes",
                ],
                properties: {
                  originalName: {
                    type: "string",
                    maxLength: 255,
                  },
                  storageKey: {
                    type: "string",
                  },
                  mimeType: {
                    type: "string",
                    nullable: true,
                  },
                  sizeBytes: {
                    type: "integer",
                    minimum: 0,
                  },
                  checksum: {
                    type: "string",
                    nullable: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "File metadata created",
          },
          400: {
            description: "Invalid metadata",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          401: {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/files/upload": {
      post: {
        tags: ["Files"],
        summary: "Upload a file",
        description:
          "Uploads one PDF, PNG, JPG, JPEG, or TXT file. Maximum file size is 10 MiB.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "File uploaded successfully",
          },
          400: {
            description: "Invalid file or unsupported file type",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          401: {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          413: {
            description: "File exceeds the size limit",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/files/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
          },
        },
      ],

      get: {
        tags: ["Files"],
        summary: "Get file metadata",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "File metadata retrieved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    data: {
                      $ref: "#/components/schemas/FileMetadata",
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          404: {
            description: "File not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },

      delete: {
        tags: ["Files"],
        summary: "Delete a file",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "File deleted successfully",
          },
          401: {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          404: {
            description: "File not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/files/{id}/download": {
      get: {
        tags: ["Files"],
        summary: "Download a file",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          200: {
            description: "File downloaded successfully",
            content: {
              "application/octet-stream": {
                schema: {
                  type: "string",
                  format: "binary",
                },
              },
            },
          },
          401: {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          404: {
            description: "File not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/files/{id}/verify": {
      get: {
        tags: ["Files"],
        summary: "Verify file integrity using SHA-256",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          200: {
            description: "Integrity verification completed",
          },
          400: {
            description: "File has no checksum",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          401: {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          404: {
            description: "File not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
  },

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },

    schemas: {
      FileMetadata: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          owner_id: {
            type: "string",
            format: "uuid",
          },
          original_name: {
            type: "string",
            maxLength: 255,
          },
          storage_key: {
            type: "string",
          },
          mime_type: {
            type: "string",
            nullable: true,
          },
          size_bytes: {
            type: "integer",
            format: "int64",
            minimum: 0,
          },
          checksum: {
            type: "string",
            nullable: true,
          },
          created_at: {
            type: "string",
            format: "date-time",
          },
          updated_at: {
            type: "string",
            format: "date-time",
          },
        },
      },

      ErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          error: {
            type: "object",
            properties: {
              code: {
                type: "string",
                example: "UNAUTHORIZED",
              },
              message: {
                type: "string",
                example: "Authentication token is required",
              },
              details: {
                type: "array",
                items: {},
              },
            },
          },
        },
      },
    },
  },
};

module.exports = openapiSpecification;