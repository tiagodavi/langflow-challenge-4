"use server";

import path from "path";
import fs from "fs";
import { db } from "@/db";
import type { Document, Topic, Quiz, Question } from "@prisma/client";

export async function loadDocuments() {
  return db.document.findMany({
    include: {
      topics: {
        include: {
          quizzes: true,
        },
      },
    },
  });
}

export async function loadQuiz(id: number) {
  return db.quiz.findUnique({
    where: {
      id: id,
    },
    include: {
      questions: {
        include: {
          answers: true,
        },
      },
    },
  });
}

export async function uploadFile(formData: FormData) {
  try {
    let path: String =
      "/Users/tiagodavi/Documents/Projects/lang_quiz/documents";
    const file = formData.get("file") as File;
    const buffer = await file.arrayBuffer();
    const fileName = sanitizeFileName(file.name);
    const langflowUri =
      "http://127.0.0.1:7860/api/v1/run/desafio-4?stream=false";

    const document: Document = await db.document.create({
      data: {
        name: fileName,
      },
    });

    path = `${path}/${document.id}`;

    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);

      path = `${path}/${fileName}`;

      await db.document.update({
        where: {
          id: document.id,
        },
        data: {
          path: path,
        },
      });

      await fs.promises.writeFile(path, Buffer.from(buffer), {
        encoding: "utf8",
      });

      const response = await fetch(langflowUri, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tweaks: {
            "CustomComponent-ue92E": {
              batch_size: 50,
              chunk_size: 512,
              openai_embeddings_model: "text-embedding-3-small",
              openai_llm_model: "gpt-4o-mini",
            },
            "File-OWK5n": {
              path: path,
              silent_errors: false,
            },
          },
        }),
      });

      const jsonResponse = await response.json();
      const jsonOutput = JSON.parse(
        jsonResponse["outputs"][0]["outputs"][0]["outputs"]["text"]["message"]
      );

      const topic: Topic = await db.topic.create({
        data: {
          documentId: document.id,
          name: "Sample Topic",
        },
      });

      const quiz: Quiz = await db.quiz.create({
        data: {
          topicId: topic.id,
          name: "Sample Quiz",
        },
      });

      await Promise.all(
        jsonOutput.quiz.map(async (q: any) => {
          const question: Question = await db.question.create({
            data: {
              quizId: quiz.id,
              name: q.question,
            },
          });

          q.options.map(async (a: any) => {
            await db.answer.create({
              data: {
                questionId: question.id,
                name: a.answer,
                valid: a.valid,
              },
            });
          });
        })
      );

      return { output: jsonOutput };
    }
  } catch (err) {
    console.error(err);

    return { error: "Error uploading file..." };
  }
}

function sanitizeFileName(filename: String) {
  // Get the file extension
  const ext = path.extname(filename);

  // Get the filename without the extension
  const nameWithoutExt = path.basename(filename, ext);

  // Convert to lowercase and remove special characters (keep only alphanumeric and dashes/underscores)
  const sanitized = nameWithoutExt.toLowerCase().replace(/[^a-z0-9-_]/g, "");

  // Return the sanitized name with its extension
  return sanitized + ext;
}
