import { NextResponse } from "next/server";
import Client from "../../../../vision";

export async function POST(req) {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json(
        { errorMessage: "No image URL provided" },
        { status: 400 }
      );
    }

    // Call the Vision API with specific features for the task.
    const [result] = await Client.annotateImage({
      image: { source: { imageUri: imageUrl } },
      features: [
        { type: "LOGO_DETECTION" },
        { type: "TEXT_DETECTION" },
        { type: "IMAGE_PROPERTIES" },
        { type: "LABEL_DETECTION" },
        { type: "WEB_DETECTION" },
      ],
    });
    // Extract relevant details from the response.
    const logos =
      result.logoAnnotations?.map((logo) => ({
        description: logo.description,
        score: logo.score,
      })) || [];

    const texts =
      result.textAnnotations?.slice(0, 1).map((text) => ({
        description: text.description,
      })) || [];

    const webEntities = result.webDetection?.webEntities || [];
    const descriptions = webEntities
      .slice(0, 5)
      .map((e) => e.description)
      .filter(Boolean);
    const descriptionString = descriptions.join("\n");

    const garmentLabels =
      result.labelAnnotations?.slice(0, 4).map((label) => ({
        description: label.description,
        score: label.score,
      })) || [];

    // Return the extracted data as JSON.
    return NextResponse.json(
      {
        message: "Image processed successfully",
        logos,
        texts,
        descriptions: descriptionString,
        garmentLabels,
      },
      { status: 200 }
    );
  } catch (error) {
    // Return the error message.
    return NextResponse.json(
      { errorMessage: error.message },
      { status: 500 } // Internal server error status code
    );
  }
}
