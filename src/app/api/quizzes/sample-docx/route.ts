import { NextResponse } from 'next/server';
import JSZip from 'jszip';

export async function GET() {
  const zip = new JSZip();

  // [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  // _rels/.rels
  const relsFolder = zip.folder('_rels');
  relsFolder?.file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // word/document.xml
  const wordFolder = zip.folder('word');
  wordFolder?.file(
    'document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>1. What is the Big O complexity of binary search in a sorted array?</w:t></w:r></w:p>
    <w:p><w:r><w:t>A. O(n)</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>B. O(log n)</w:t></w:r></w:p>
    <w:p><w:r><w:t>C. O(n^2)</w:t></w:r></w:p>
    <w:p><w:r><w:t>D. O(1)</w:t></w:r></w:p>
    <w:p></w:p>
    <w:p><w:r><w:t>2. Which data structure operates on a Last-In, First-Out (LIFO) principle?</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>A. Stack</w:t></w:r></w:p>
    <w:p><w:r><w:t>B. Queue</w:t></w:r></w:p>
    <w:p><w:r><w:t>C. Binary Search Tree</w:t></w:r></w:p>
    <w:p><w:r><w:t>D. Priority Queue</w:t></w:r></w:p>
    <w:p></w:p>
    <w:p><w:r><w:t>3. In ACID transaction properties, what does 'A' stand for?</w:t></w:r></w:p>
    <w:p><w:r><w:t>A. Authentication</w:t></w:r></w:p>
    <w:p><w:r><w:t>B. Allocation</w:t></w:r></w:p>
    <w:p><w:r><w:t>C. Availability</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>D. Atomicity</w:t></w:r></w:p>
    <w:p></w:p>
    <w:p><w:r><w:t>4. What is the primary purpose of indexing in relational databases?</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>A. To speed up data retrieval queries</w:t></w:r></w:p>
    <w:p><w:r><w:t>B. To encrypt sensitive stored data</w:t></w:r></w:p>
    <w:p><w:r><w:t>C. To automatically duplicate tables</w:t></w:r></w:p>
    <w:p><w:r><w:t>D. To reduce disk storage consumed</w:t></w:r></w:p>
    <w:p></w:p>
    <w:p><w:r><w:t>5. Which protocol is primarily used to securely transfer files over SSH?</w:t></w:r></w:p>
    <w:p><w:r><w:t>A. FTP</w:t></w:r></w:p>
    <w:p><w:r><w:t>B. HTTP</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>C. SFTP</w:t></w:r></w:p>
    <w:p><w:r><w:t>D. SMTP</w:t></w:r></w:p>
  </w:body>
</w:document>`
  );

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="Sample_College_Quiz.docx"',
    },
  });
}
