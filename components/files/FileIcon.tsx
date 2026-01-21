import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Image,
  FileArchive,
  FileCode,
  File,
} from "lucide-react";

interface FileIconProps {
  mimeType: string;
  size?: number;
  className?: string;
}

/**
 * آیکون فایل بر اساس MIME type
 */
export default function FileIcon({
  mimeType,
  size = 20,
  className = "",
}: FileIconProps) {
  const iconProps = {
    size,
    className: `${className}`,
  };

  // Images
  if (mimeType.startsWith("image/")) {
    return <Image {...iconProps} className={`${className} text-purple-500`} />;
  }

  // PDF & Documents
  if (
    mimeType === "application/pdf" ||
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return <FileText {...iconProps} className={`${className} text-red-500`} />;
  }

  // Spreadsheets
  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "text/csv"
  ) {
    return (
      <FileSpreadsheet {...iconProps} className={`${className} text-green-500`} />
    );
  }

  // Presentations
  if (
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return (
      <Presentation {...iconProps} className={`${className} text-orange-500`} />
    );
  }

  // Archives
  if (
    mimeType === "application/zip" ||
    mimeType === "application/x-rar-compressed" ||
    mimeType === "application/x-7z-compressed"
  ) {
    return (
      <FileArchive {...iconProps} className={`${className} text-yellow-500`} />
    );
  }

  // Code files
  if (
    mimeType === "application/json" ||
    mimeType === "application/xml" ||
    mimeType === "text/html" ||
    mimeType === "text/css" ||
    mimeType === "text/javascript"
  ) {
    return <FileCode {...iconProps} className={`${className} text-blue-500`} />;
  }

  // Text files
  if (mimeType.startsWith("text/")) {
    return <FileText {...iconProps} className={`${className} text-gray-500`} />;
  }

  // Default
  return <File {...iconProps} className={`${className} text-gray-400`} />;
}
