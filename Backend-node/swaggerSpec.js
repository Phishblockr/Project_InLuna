import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "InLuna API",
      version: "1.0.0",
      description: "Auto-generated API documentation for the InLuna backend",
    },
    servers: [
      {
        url:
          process.env.BASE_URL ||
          `http://localhost:${process.env.PORT || 5000}`,
      },
    ],
  },
  // Scan route files for JSDoc comments describing endpoints
  apis: ["./routes/**/*.js", "./routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
