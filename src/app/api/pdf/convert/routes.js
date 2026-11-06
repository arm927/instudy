
export const runtime = "nodejs";

export async function POST(request) {
  try {
    // Get the uploaded PDF from the frontend
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return Response.json(
        { error: "Please upload a PDF file." },
        { status: 400 }
      );
    }

    // Validate the uploaded file
    if (!file.name?.toLowerCase().endsWith(".pdf")) {
      return Response.json(
        { error: "Only PDF files are supported." },
        { status: 400 }
      );
    }

    // Prepare the file for the Python service
    const pythonFormData = new FormData();

    pythonFormData.append("files", file, file.name);

    // Forward the PDF to OpenDataLoader Hybrid
    const response = await fetch(
      "http://127.0.0.1:5002/v1/convert/file",
      {
        method: "POST",
        body: pythonFormData,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          error: "PDF conversion failed.",
          details: result,
        },
        { status: response.status }
      );
    }

    return Response.json(result);
  } catch (error) {
    console.error("PDF conversion API error:", error);

    return Response.json(
      { error: "Something went wrong while processing the PDF." },
      { status: 500 }
    );
  }
}
