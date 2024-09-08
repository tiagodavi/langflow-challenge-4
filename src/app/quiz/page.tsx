"use client";

import React, { useState, useEffect, startTransition } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import * as actions from '@/actions';
import type { Answer, Document, Question, Quiz, Topic,} from "@prisma/client";

const Dashboard: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
 
  const fakeProgress = () => {
    // Reset progress to 0 at the start of each upload
    setProgress(0);

    const interval = setInterval(() => {
      setIsUploading(true);
      setProgress((prevProgress) => {
        if (prevProgress >= 90) {
          clearInterval(interval); // Stop incrementing around 90%
          return prevProgress; // Let the actual upload complete it
        }
        return prevProgress + Math.random() * 10; // Increment progress
      });
    }, 500); // Increment every 500ms

    return interval; // Return the interval ID so we can clear it later
  };

  const filteredDocs = documents.filter(doc =>
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  const headerColor = "#fff3d9";
  const bodyColor = "#3b0918";

  const loadDocuments = () => {
    startTransition(async () => {
      const documents: Document[] = await actions.loadDocuments();
      setDocuments(documents);
    });
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file: File = acceptedFiles[0];
  
    startTransition(async () => {

       // Start the fake progress animation
      setIsUploading(true);
      const interval = fakeProgress();

      const formData = new FormData();
      formData.append("file", file);

      await actions.uploadFile(formData);

      clearInterval(interval); // Clear interval when upload completes
      setProgress(100); // Ensure progress is set to 100 when done
      setIsUploading(false);

      loadDocuments();
    });
   
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const openQuiz = async (document: Document) => {

    let quizId: number = 0;
   
    for (const topic of document.topics) {
      for (const quiz of topic.quizzes) {
        quizId = quiz.id;
      }
    }

    const quiz: Quiz = await actions.loadQuiz(quizId);

    const questions = quiz.questions.map((question: Question) => ({
      type: 'single',
      question: question.name,
      options: question.answers.map((answer: Answer) => answer.name)
    }));

    setQuiz({
      questions: questions
    });
    setSelectedDoc(document);
    setProgress(50);
  };

  const saveQuiz = () => {
    // Save quiz logic
    setQuiz(null);
    setSelectedDoc(null);
  };

  return (
    <div style={{ backgroundColor: bodyColor }} className={`flex flex-col h-screen`}>
      <header style={{ backgroundColor: headerColor }}  className={`flex justify-between items-center p-4`}>
        <Image src="/logo.internal.png" alt="Logo" width={100} height={100} />
        <div className="relative">
          <Image
            src="/user.jpeg"
            alt="User"
            width={80}
            height={107}
            objectFit="cover"
            style={{clipPath: 'circle()'}}
            className="cursor-pointer"
          />
        </div>
      </header>
      <main className="flex flex-col items-center justify-center flex-grow">
        <div
          {...getRootProps()}
          style={{ borderColor: headerColor }}
          className="w-72 h-48 border-2 border-dashed rounded-lg flex items-center justify-center bg-white cursor-pointer"
        >
          <input {...getInputProps()} />
          <p className="text-gray-400">{isDragActive ? 'Drop the PDF file here...' : 'Drag & Drop a PDF file here'}</p>
        </div>
        <input
          type="text"
          placeholder="Search documents..."
          className="text-black mt-4 w-4/5 max-w-lg p-2 border border-gray-300 rounded-lg"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {isUploading && (
          <div>
            <p>Uploading: {progress}%</p>
            <progress value={progress} max="100"></progress>
          </div>
      )}
        <div className="w-4/5 max-w-lg mt-4">
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              className="flex justify-between p-2 border-b border-gray-300 cursor-pointer"
              onClick={() => openQuiz(doc)}
            >
              <span className="text-white">{doc.name}</span>
            </div>
          ))}
        </div>
      </main>
      {quiz && selectedDoc && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white p-6 rounded-lg w-96">
      <div className="w-full bg-gray-300 rounded-full h-4 mb-4">
        <div
          className="bg-[#337BF0] h-4 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Render quiz questions here */}
      <div className="space-y-4">
        {quiz.questions.map((question: any, index: number) => (
          <div key={index} className="flex flex-col">
            <p className="text-gray-700 font-semibold mb-2">
                {question.question}
            </p>

            {question.type === 'single' && (
              <div>
                {question.options.map((option: string, optIndex: number) => (
                  <label key={optIndex} className="text-sm text-gray-700 block">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option}
                      className="mr-2"
                      onChange={() =>
                        setQuiz((prevQuiz: any) => ({
                          ...prevQuiz,
                          answers: { ...prevQuiz.answers, [index]: option },
                        }))
                      }
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}

            {question.type === 'multiple' && (
              <div>
                {question.options.map((option: string, optIndex: number) => (
                  <label key={optIndex} className="text-sm text-gray-700 block">
                    <input
                      type="checkbox"
                      name={`question-${index}`}
                      value={option}
                      className="mr-2"
                      onChange={() => {
                        setQuiz((prevQuiz: any) => {
                          const prevAnswers = prevQuiz.answers[index] || [];
                          const newAnswers = prevAnswers.includes(option)
                            ? prevAnswers.filter((ans: string) => ans !== option)
                            : [...prevAnswers, option];
                          return {
                            ...prevQuiz,
                            answers: { ...prevQuiz.answers, [index]: newAnswers },
                          };
                        });
                      }}
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}

            {question.type === 'text' && (
              <textarea
                className="text-gray-700 w-full p-2 border border-gray-300 rounded-lg"
                onChange={(e) =>
                  setQuiz((prevQuiz: any) => ({
                    ...prevQuiz,
                    answers: { ...prevQuiz.answers, [index]: e.target.value },
                  }))
                }
              />
            )}
          </div>
        ))}
      </div>

      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
        onClick={saveQuiz}
      >
        Save
      </button>
      <button
        className="ml-2 mt-2 px-4 py-2 bg-gray-500 text-white rounded-lg"
        onClick={() => setQuiz(null)}
      >
        Reset
      </button>
    </div>
  </div>
)}

    </div>
  );
};

export default Dashboard;
