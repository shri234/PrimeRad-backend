// Mock all modules BEFORE requiring the controller
jest.mock("../models/pathology.model");
jest.mock("../models/module.model");
jest.mock("../config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));
jest.mock("fs");

const Pathology = require("../models/pathology.model");
const Module = require("../models/module.model");
const logger = require("../config/logger");
const fs = require("fs");
const path = require("path");
const {
  getPathologies,
  createPathologies,
  updatePathologies,
  getPathologyImages,
  getPathologiesByModule,
} = require("../controllers/pathology.controller");

describe("Pathology Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {},
      body: {},
      file: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      sendFile: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe("getPathologies", () => {
    it("should return all pathologies successfully", async () => {
      const mockPathologies = [
        { _id: "1", pathologyName: "Test Pathology 1" },
        { _id: "2", pathologyName: "Test Pathology 2" },
      ];
      Pathology.find.mockResolvedValue(mockPathologies);

      await getPathologies(req, res);

      expect(Pathology.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Got Pathologies Successfully",
        data: mockPathologies,
      });
      expect(logger.info).toHaveBeenCalledWith("Got Pathologies Successfully");
    });

    it("should return 404 when pathologies not found", async () => {
      Pathology.find.mockResolvedValue(null);

      await getPathologies(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Not Found" });
      expect(logger.info).toHaveBeenCalledWith("Pathologies Not found");
    });

    it("should handle errors and return 404", async () => {
      const error = new Error("Database error");
      Pathology.find.mockRejectedValue(error);

      await getPathologies(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Not Found" });
      expect(logger.error).toHaveBeenCalledWith(
        `Error Internal Server Error message: ${error}`
      );
    });
  });

  describe("getPathologyImages", () => {
    it("should return image successfully", async () => {
      const mockPathology = {
        _id: "123",
        imageUrl: "uploads/test.jpg",
      };
      req.query.pathologyId = "123";
      Pathology.findById.mockResolvedValue(mockPathology);
      fs.existsSync.mockReturnValue(true);

      await getPathologyImages(req, res);

      expect(Pathology.findById).toHaveBeenCalledWith("123");
      expect(fs.existsSync).toHaveBeenCalled();
      expect(res.set).toHaveBeenCalledWith("Content-Type", "image/jpeg");
      expect(res.sendFile).toHaveBeenCalled();
    });

    it("should return 404 when pathology not found", async () => {
      req.query.pathologyId = "123";
      Pathology.findById.mockResolvedValue(null);

      await getPathologyImages(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Pathology Not Found" });
      expect(logger.info).toHaveBeenCalledWith("Image for Pathology not found");
    });

    it("should return 404 when image file does not exist", async () => {
      const mockPathology = {
        _id: "123",
        imageUrl: "uploads/test.jpg",
      };
      req.query.pathologyId = "123";
      Pathology.findById.mockResolvedValue(mockPathology);
      fs.existsSync.mockReturnValue(false);

      await getPathologyImages(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Image Not Found" });
      expect(logger.info).toHaveBeenCalledWith(
        "Image not found in the upload folder"
      );
    });

    it("should handle errors and return 500", async () => {
      const error = new Error("Database error");
      req.query.pathologyId = "123";
      Pathology.findById.mockRejectedValue(error);

      await getPathologyImages(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server Error",
        error: error.message,
      });
      expect(logger.error).toHaveBeenCalledWith(
        `Error Internal Server Error message: ${error}`
      );
    });
  });

  describe("createPathologies", () => {
    it("should create pathology successfully with image", async () => {
      const mockModule = { _id: "module123" };
      const mockPathology = {
        _id: "path123",
        pathologyName: "Test Pathology",
        description: "Test Description",
        moduleId: "module123",
        imageUrl: "/uploads/test.jpg",
        save: jest.fn().mockResolvedValue(true),
      };

      req.query.moduleId = "module123";
      req.body = {
        pathologyName: "Test Pathology",
        description: "Test Description",
      };
      req.file = { filename: "test.jpg" };

      Module.findById.mockResolvedValue(mockModule);
      Pathology.create.mockResolvedValue(mockPathology);

      await createPathologies(req, res);

      expect(Module.findById).toHaveBeenCalledWith("module123");
      expect(Pathology.create).toHaveBeenCalledWith({
        pathologyName: "Test Pathology",
        description: "Test Description",
        moduleId: "module123",
        imageUrl: "/uploads/test.jpg",
      });
      expect(mockPathology.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Pathologies Created Successfully",
        data: mockPathology,
      });
      expect(logger.info).toHaveBeenCalledWith(
        "Pathology created successfully"
      );
    });

    it("should create pathology successfully without image", async () => {
      const mockModule = { _id: "module123" };
      const mockPathology = {
        _id: "path123",
        pathologyName: "Test Pathology",
        description: "Test Description",
        moduleId: "module123",
        imageUrl: null,
        save: jest.fn().mockResolvedValue(true),
      };

      req.query.moduleId = "module123";
      req.body = {
        pathologyName: "Test Pathology",
        description: "Test Description",
      };

      Module.findById.mockResolvedValue(mockModule);
      Pathology.create.mockResolvedValue(mockPathology);

      await createPathologies(req, res);

      expect(Pathology.create).toHaveBeenCalledWith({
        pathologyName: "Test Pathology",
        description: "Test Description",
        moduleId: "module123",
        imageUrl: null,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle save error and return 404", async () => {
      const mockModule = { _id: "module123" };
      const mockPathology = {
        _id: "path123",
        pathologyName: "Test Pathology",
        description: "Test Description",
        moduleId: "module123",
        imageUrl: null,
        save: jest.fn().mockRejectedValue(new Error("Save failed")),
      };

      req.query.moduleId = "module123";
      req.body = {
        pathologyName: "Test Pathology",
        description: "Test Description",
      };

      Module.findById.mockResolvedValue(mockModule);
      Pathology.create.mockResolvedValue(mockPathology);

      await createPathologies(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Not Found",
        error: expect.any(Error),
      });
    });

    it("should handle errors and return 404", async () => {
      const error = new Error("Database error");
      req.query.moduleId = "module123";
      req.body = {
        pathologyName: "Test Pathology",
        description: "Test Description",
      };

      Module.findById.mockRejectedValue(error);

      await createPathologies(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Not Found",
        error: error,
      });
      expect(logger.error).toHaveBeenCalledWith(
        `Error Internal Server Error message: ${error}`
      );
    });
  });

  describe("getPathologiesByModule", () => {
    it("should return pathologies for a single module ID", async () => {
      const mockPathologies = [
        { _id: "1", pathologyName: "Test 1", moduleId: "module123" },
        { _id: "2", pathologyName: "Test 2", moduleId: "module123" },
      ];
      req.query.moduleId = "module123";
      Pathology.find.mockResolvedValue(mockPathologies);

      await getPathologiesByModule(req, res);

      expect(Pathology.find).toHaveBeenCalledWith({
        moduleId: { $in: ["module123"] },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Got Pathologies for modules Successfully",
        data: mockPathologies,
      });
    });

    it("should return pathologies for multiple module IDs (comma-separated)", async () => {
      const mockPathologies = [
        { _id: "1", pathologyName: "Test 1", moduleId: "module123" },
        { _id: "2", pathologyName: "Test 2", moduleId: "module456" },
      ];
      req.query.moduleId = "module123, module456";
      Pathology.find.mockResolvedValue(mockPathologies);

      await getPathologiesByModule(req, res);

      expect(Pathology.find).toHaveBeenCalledWith({
        moduleId: { $in: ["module123", "module456"] },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return pathologies for multiple module IDs (array)", async () => {
      const mockPathologies = [
        { _id: "1", pathologyName: "Test 1", moduleId: "module123" },
      ];
      req.query.moduleId = ["module123", "module456"];
      Pathology.find.mockResolvedValue(mockPathologies);

      await getPathologiesByModule(req, res);

      expect(Pathology.find).toHaveBeenCalledWith({
        moduleId: { $in: ["module123", "module456"] },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 when moduleId is missing", async () => {
      req.query.moduleId = undefined;

      await getPathologiesByModule(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Module ID(s) are required",
      });
    });

    it("should return 400 when moduleId is empty array", async () => {
      req.query.moduleId = [];

      await getPathologiesByModule(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Module ID(s) are required",
      });
    });

    it("should return 400 for invalid moduleId format", async () => {
      req.query.moduleId = 123;

      await getPathologiesByModule(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid format for Module ID(s)",
      });
    });

    it("should return 404 when no pathologies found", async () => {
      req.query.moduleId = "module123";
      Pathology.find.mockResolvedValue([]);

      await getPathologiesByModule(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "No pathologies found for these modules",
      });
      expect(logger.info).toHaveBeenCalledWith(
        "No pathologies found for module IDs: module123"
      );
    });

    it("should handle errors and return 500", async () => {
      const error = new Error("Database error");
      req.query.moduleId = "module123";
      Pathology.find.mockRejectedValue(error);

      await getPathologiesByModule(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server Error",
        error: error.message,
      });
      expect(logger.error).toHaveBeenCalledWith(
        `Error getting pathologies by modules: ${error.message}`
      );
    });
  });
});
