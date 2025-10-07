const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true, // e.g., "Chief of Radiology"
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    required: true,
  },

  // Professional Specializations
  specializations: [
    {
      type: String,
      trim: true, // e.g., "Interventional Radiology", "Cardiac Imaging", "Musculoskeletal Radiology"
    },
  ],

  // Social Media Links
  socialMedia: {
    twitter: {
      type: String,
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
    },
    // Can add more social platforms as needed
  },

  // Educational Background
  education: [
    {
      degree: {
        type: String,
        required: true,
        trim: true, // e.g., "MD - Doctor of Medicine"
      },
      institution: {
        type: String,
        required: true,
        trim: true, // e.g., "Harvard Medical School"
      },
      year: {
        type: Number,
        required: true,
      },
      type: {
        type: String,
        enum: ["degree", "residency", "fellowship", "certification"],
        default: "degree",
      },
    },
  ],

  // Professional Experience
  experience: [
    {
      position: {
        type: String,
        required: true,
        trim: true,
      },
      institution: {
        type: String,
        required: true,
        trim: true,
      },
      startYear: {
        type: Number,
        required: true,
      },
      endYear: {
        type: Number, // null for current positions
      },
      description: {
        type: String,
        trim: true,
      },
    },
  ],

  // Research Information
  research: {
    areas: [
      {
        type: String,
        trim: true,
      },
    ],
    interests: [
      {
        type: String,
        trim: true,
      },
    ],
    currentProjects: [
      {
        title: {
          type: String,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        collaborators: [
          {
            type: String,
            trim: true,
          },
        ],
      },
    ],
  },

  // Publications
  publications: [
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },
      authors: [
        {
          type: String,
          trim: true,
        },
      ],
      journal: {
        type: String,
        trim: true,
      },
      year: {
        type: Number,
        required: true,
      },
      doi: {
        type: String,
        trim: true,
      },
      pmid: {
        type: String,
        trim: true,
      },
      type: {
        type: String,
        enum: ["journal", "conference", "book", "chapter", "abstract"],
        default: "journal",
      },
    },
  ],

  // Awards and Recognition
  awards: [
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },
      organization: {
        type: String,
        trim: true,
      },
      year: {
        type: Number,
        required: true,
      },
      description: {
        type: String,
        trim: true,
      },
    },
  ],

  // Professional Memberships
  memberships: [
    {
      organization: {
        type: String,
        required: true,
        trim: true,
      },
      position: {
        type: String,
        trim: true,
      },
      startYear: {
        type: Number,
      },
      endYear: {
        type: Number,
      },
    },
  ],

  // Contact Preferences
  availability: {
    office_hours: {
      type: String,
      trim: true,
    },
    appointment_required: {
      type: Boolean,
      default: true,
    },
  },

  // Status and Visibility
  status: {
    type: String,
    enum: ["active", "inactive", "retired", "sabbatical"],
    default: "active",
  },
  isPublic: {
    type: Boolean,
    default: true,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
facultySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for search functionality
facultySchema.index({
  name: "text",
  description: "text",
  specializations: "text",
  "education.institution": "text",
});

// Virtual for years of experience calculation
facultySchema.virtual("yearsOfExperience").get(function () {
  if (this.education && this.education.length > 0) {
    const oldestEducation = this.education.reduce((oldest, current) =>
      current.year < oldest.year ? current : oldest
    );
    return new Date().getFullYear() - oldestEducation.year;
  }
  return 0;
});

module.exports = mongoose.model("Faculty", facultySchema);
