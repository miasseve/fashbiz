import { NextResponse } from "next/server";
import Client from "../../../../vision";

export async function POST(req) {
  try {
    const { imageUrl } = await req.json();
    console.log(imageUrl,'imageUrl');
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

    const dominantColors =
      result.imagePropertiesAnnotation?.dominantColors?.colors
        ?.sort((a, b) => b.pixelFraction - a.pixelFraction)
        .slice(0, 3) // Take top 3 colors.
        .map((color) => ({
          red: color.color.red,
          green: color.color.green,
          blue: color.color.blue,
          fraction: color.pixelFraction,
        })) || [];

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
        colors: dominantColors,
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
