/**
 * ML Pipeline Service - Bridges Node.js backend with Python ML pipeline
 * Handles resume processing, skill extraction, and question generation
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { ApiError } from './apiError.js';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ML_SCRIPTS_DIR = path.join(__dirname, '../../..', 'ML_Preprocessor_scripts');
const TEMP_DIR = path.join(ML_SCRIPTS_DIR, 'temp_resumes');
const USER_RESUMES_DIR = path.join(ML_SCRIPTS_DIR, 'user_resumes');

class MLPipelineService {
  /**
   * Initialize temp directories
   */
  static async initializeDirs() {
    try {
      await fs.mkdir(TEMP_DIR, { recursive: true });
      await fs.mkdir(USER_RESUMES_DIR, { recursive: true });
    } catch (error) {
      console.error('Error initializing directories:', error);
    }
  }

  /**
   * Save resume buffer to temporary file
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {string} userId - User ID for organization
   * @returns {Promise<string>} - Path to saved resume
   */
  static async saveResumeFile(pdfBuffer, userId) {
    try {
      const userDir = path.join(USER_RESUMES_DIR, userId);
      await fs.mkdir(userDir, { recursive: true });

      const resumePath = path.join(userDir, 'resume.pdf');
      await fs.writeFile(resumePath, pdfBuffer);

      return resumePath;
    } catch (error) {
      throw new ApiError(500, `Failed to save resume: ${error.message}`);
    }
  }

  /**
   * Process resume and extract skills using Python pipeline
   * @param {string} resumePath - Path to resume PDF
   * @returns {Promise<Object>} - { profileString, expandedSkills }
   */
  static async processResume(resumePath) {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(
        ML_SCRIPTS_DIR,
        'pipeline/profile_builder.py'
      );

      const python = spawn('python3', [pythonScript, resumePath], {
        cwd: ML_SCRIPTS_DIR,
        timeout: 30000, // 30 seconds timeout
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error('Python stderr:', data.toString());
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(
            new ApiError(
              500,
              `Resume processing failed: ${stderr || 'Unknown error'}`
            )
          );
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (parseError) {
          reject(new ApiError(500, `Invalid response from ML pipeline: ${parseError.message}`));
        }
      });

      python.on('error', (error) => {
        reject(new ApiError(500, `Failed to spawn Python process: ${error.message}`));
      });
    });
  }

  /**
   * Search for questions using FAISS + tag boosting
   * @param {string} profileString - User's semantic profile
   * @param {Array<string>} userSkills - Extracted user skills
   * @param {number} topK - Number of results
   * @returns {Promise<Array>} - Array of recommended questions
   */
  static async searchQuestions(profileString, userSkills, topK = 30) {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(
        ML_SCRIPTS_DIR,
        'search/searcher.py'
      );

      // Create a temporary Python script that imports and runs the searcher
      const searcherRunner = path.join(TEMP_DIR, `searcher_${Date.now()}.py`);
      const searchCode = `
import sys
sys.path.insert(0, '${ML_SCRIPTS_DIR}')
import json
from search.searcher import SemanticSearcher

searcher = SemanticSearcher(
    '${path.join(ML_SCRIPTS_DIR, 'data/questions.json')}',
    '${path.join(ML_SCRIPTS_DIR, 'data/questions.index')}'
)

results = searcher.search(
    '${profileString}',
    user_skills=${json.dumps(userSkills)},
    use_tag_boosting=True,
    top_k=${topK}
)

print(json.dumps(results))
`;

      fs.writeFile(searcherRunner, searchCode)
        .then(() => {
          const python = spawn('python3', [searcherRunner], {
            cwd: ML_SCRIPTS_DIR,
            timeout: 15000, // 15 seconds timeout
          });

          let stdout = '';
          let stderr = '';

          python.stdout.on('data', (data) => {
            stdout += data.toString();
          });

          python.stderr.on('data', (data) => {
            stderr += data.toString();
            console.error('Python stderr:', data.toString());
          });

          python.on('close', (code) => {
            // Clean up temp script
            fs.unlink(searcherRunner).catch(() => {});

            if (code !== 0) {
              reject(
                new ApiError(
                  500,
                  `Question search failed: ${stderr || 'Unknown error'}`
                )
              );
              return;
            }

            try {
              const results = JSON.parse(stdout);
              resolve(results);
            } catch (parseError) {
              reject(
                new ApiError(500, `Invalid response from searcher: ${parseError.message}`)
              );
            }
          });

          python.on('error', (error) => {
            fs.unlink(searcherRunner).catch(() => {});
            reject(
              new ApiError(500, `Failed to spawn Python process: ${error.message}`)
            );
          });
        })
        .catch((error) => {
          reject(new ApiError(500, `Failed to create searcher script: ${error.message}`));
        });
    });
  }

  /**
   * Load questions index into memory for faster access
   * @returns {Promise<Array>} - Array of all questions
   */
  static async loadQuestionsIndex() {
    try {
      const questionsPath = path.join(
        ML_SCRIPTS_DIR,
        'data/questions.json'
      );
      const data = await fs.readFile(questionsPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      throw new ApiError(500, `Failed to load questions index: ${error.message}`);
    }
  }

  /**
   * Validate that ML pipeline is properly set up
   * @returns {Promise<boolean>}
   */
  static async validateSetup() {
    try {
      const questionsPath = path.join(
        ML_SCRIPTS_DIR,
        'data/questions.json'
      );
      const indexPath = path.join(ML_SCRIPTS_DIR, 'data/questions.index');

      const questionsExists = await fs
        .access(questionsPath)
        .then(() => true)
        .catch(() => false);
      const indexExists = await fs
        .access(indexPath)
        .then(() => true)
        .catch(() => false);

      return questionsExists && indexExists;
    } catch (error) {
      console.error('ML pipeline validation failed:', error);
      return false;
    }
  }
}

// Initialize on import
MLPipelineService.initializeDirs();

export default MLPipelineService;
