import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

// This exports the hook needed for your custom paperclip UI
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();