import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { QuizQuestion } from '@/db/schema';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Please select a Microsoft Word (.docx) file to upload.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const zip = new JSZip();
    let zipArchive;

    try {
      zipArchive = await zip.loadAsync(arrayBuffer);
    } catch {
      return NextResponse.json(
        { error: 'Failed to read the file. Please make sure it is a valid Microsoft Word (.docx) file.' },
        { status: 400 }
      );
    }

    const docXmlFile = zipArchive.file('word/document.xml');
    if (!docXmlFile) {
      return NextResponse.json(
        { error: 'Invalid document structure. Could not find document.xml in the Word archive.' },
        { status: 400 }
      );
    }

    const docXml = await docXmlFile.async('text');

    // Parse paragraphs from docXml
    // A paragraph is enclosed in <w:p> ... </w:p>
    const pRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g;
    const paragraphs: { text: string; isRed: boolean }[] = [];

    let pMatch;
    while ((pMatch = pRegex.exec(docXml)) !== null) {
      const pContent = pMatch[1];

      // Extract all text nodes <w:t> ... </w:t>
      const tRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
      let fullText = '';
      let tMatch;
      while ((tMatch = tRegex.exec(pContent)) !== null) {
        // Decode simple XML entities
        const cleanT = tMatch[1]
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'");
        fullText += cleanT;
      }

      fullText = fullText.trim();
      if (!fullText) continue;

      // Detect if this paragraph contains a red color tag
      // Common red hex values in Word: FF0000, C00000, ED1C24, red, etc.
      // Or check if the text contains explicit indicators like (Correct Answer) or *
      const isRedXml = /<w:color\s+w:val="[#]?(FF[0-9A-F]{4}|C00000|E5[0-9A-F]{4}|ED[0-9A-F]{4}|red)"/i.test(pContent);
      const isExplicitText = /\((Correct|Correct Answer|Answer)\)|\*$/i.test(fullText);

      paragraphs.push({
        text: fullText,
        isRed: isRedXml || isExplicitText,
      });
    }

    // Now convert the paragraphs into a structured list of QuizQuestion objects
    const questions: QuizQuestion[] = [];
    let currentQuestion: QuizQuestion | null = null;
    let optionCounter = 0;

    for (const p of paragraphs) {
      const text = p.text;

      // Check if line starts with Question indicator (e.g. "1. ", "Q1. ", "1) ")
      const qMatch = /^\s*(?:Q|Question)?\s*(\d+)[\.\)\:]\s*(.+)/i.exec(text);

      if (qMatch) {
        // Save previous question if exists
        if (currentQuestion && currentQuestion.question && currentQuestion.options.length > 0) {
          questions.push(currentQuestion);
        }

        currentQuestion = {
          id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          question: qMatch[2].trim(),
          options: [],
          correctOptionId: '',
        };
        optionCounter = 0;
        continue;
      }

      // Check if line starts with Option indicator (e.g. "A. ", "B. ", "a) ")
      const optMatch = /^\s*([A-Ha-h])[\.\)]\s*(.+)/.exec(text);

      if (optMatch && currentQuestion) {
        const optLetter = optMatch[1].toUpperCase();
        let optText = optMatch[2].trim();

        // Clean explicit indicators if any
        optText = optText.replace(/\s*\((Correct|Correct Answer|Answer)\)|\*$/i, '').trim();

        const optId = `opt_${optLetter}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        currentQuestion.options.push({
          id: optId,
          text: `${optLetter}. ${optText}`,
        });

        if (p.isRed) {
          currentQuestion.correctOptionId = optId;
        }
        optionCounter++;
        continue;
      }

      // If we don't have option match but have a currentQuestion, it might be continuation or unnumbered option
      if (currentQuestion) {
        if (currentQuestion.options.length < 4 && !/^\d+/.test(text)) {
          // Assume it's an option if we don't have 4 options yet
          const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
          const optLetter = letters[currentQuestion.options.length] || 'O';
          let optText = text.replace(/\s*\((Correct|Correct Answer|Answer)\)|\*$/i, '').trim();
          const optId = `opt_${optLetter}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          currentQuestion.options.push({
            id: optId,
            text: `${optLetter}. ${optText}`,
          });

          if (p.isRed) {
            currentQuestion.correctOptionId = optId;
          }
        } else {
          // Continue question text
          currentQuestion.question += `\n${text}`;
        }
      }
    }

    // Push the last question
    if (currentQuestion && currentQuestion.question && currentQuestion.options.length > 0) {
      questions.push(currentQuestion);
    }

    if (questions.length === 0) {
      return NextResponse.json(
        {
          error:
            'No questions or options could be detected in the document. Please ensure your questions start with numbers (1. Question) and options start with letters (A. Option).',
        },
        { status: 400 }
      );
    }

    // Double check that questions have at least some correct option ID. If not, default to the first option
    // or let the faculty pick in the preview.
    const finalizedQuestions = questions.map((q) => {
      if (!q.correctOptionId && q.options.length > 0) {
        // Find if any option text has Correct or red in it, or fallback to Option A
        q.correctOptionId = q.options[0].id;
      }
      return q;
    });

    return NextResponse.json({
      message: `Successfully detected ${finalizedQuestions.length} questions.`,
      questions: finalizedQuestions,
    });
  } catch (err: unknown) {
    console.error('Error parsing DOCX:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing the document.' },
      { status: 500 }
    );
  }
}
