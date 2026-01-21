"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FolderPlus,
  Search,
  Grid3x3,
  List,
  RefreshCw,
  Trash2,
} from "lucide-react";
import FolderTreeView from "@/components/files/FolderTreeView";
import FolderBreadcrumb from "@/components/files/FolderBreadcrumb";
import FileList from "@/components/files/FileList";
import UploadModal from "@/components/files/UploadModal";
import CreateFolderModal from "@/components/files/CreateFolderModal";
import FilePreviewModal from "@/components/files/FilePreviewModal";
import TagFilter from "@/components/files/TagFilter";

/**
 * صفحه مرورگر فایل - ادمین (سطح سازمان)
 */
export default function FilesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // States
  const [folders, setFolders] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbFolders, setBreadcrumbFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  // Auth check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);

  // Fetch settings for suggested tags
  useEffect(() => {
    fetchSettings();
  }, []);

  // Fetch folders and files
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchFolders();
      fetchFiles();
    }
  }, [status, session, currentFolderId, searchQuery, selectedTags, sortBy, sortOrder, page]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/files/settings");
      if (res.ok) {
        const data = await res.json();
        setSuggestedTags(data.settings.suggestedTags || []);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchFolders = async () => {
    try {
      const params = new URLSearchParams();
      // فقط فایل‌های سازمانی (projectId = null)
      params.append("orgLevel", "true");

      const res = await fetch(`/api/files/folders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);

        // ساخت breadcrumb
        if (currentFolderId) {
          buildBreadcrumb(data.folders, currentFolderId);
        } else {
          setBreadcrumbFolders([]);
        }
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  };

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentFolderId) params.append("folderId", currentFolderId);
      if (searchQuery) params.append("search", searchQuery);
      if (selectedTags.length > 0) params.append("tags", selectedTags.join(","));
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);
      params.append("page", page.toString());
      params.append("limit", "20");
      // فقط فایل‌های سازمانی
      params.append("orgLevel", "true");

      const res = await fetch(`/api/files/list?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  const buildBreadcrumb = (allFolders: any[], folderId: string) => {
    const path: any[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder = allFolders.find((f: any) => f.id === currentId);
      if (!folder) break;
      path.unshift(folder);
      currentId = folder.parentId;
    }

    setBreadcrumbFolders(path);
  };

  const handleFolderSelect = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleUploadComplete = (uploadedFiles: any[]) => {
    fetchFiles();
    fetchFolders();
  };

  const handleFolderCreated = (folder: any) => {
    fetchFolders();
  };

  const handleDownload = async (file: any) => {
    try {
      // افزایش شمارنده دانلود
      await fetch(`/api/files/${file.id}`, { method: "GET" });

      // دانلود فایل
      window.open(file.url, "_blank");
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const handleRename = async (file: any) => {
    const newName = prompt("نام جدید فایل:", file.name);
    if (!newName || newName === file.name) return;

    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (res.ok) {
        fetchFiles();
      } else {
        const data = await res.json();
        alert(data.error || "خطا در تغییر نام");
      }
    } catch (error) {
      console.error("Error renaming file:", error);
      alert("خطا در تغییر نام");
    }
  };

  const handleMove = async (file: any) => {
    const targetFolderId = prompt(
      "ID پوشه مقصد را وارد کنید (برای root خالی بگذارید):",
      file.folderId || ""
    );
    if (targetFolderId === null) return;

    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId: targetFolderId || null,
        }),
      });

      if (res.ok) {
        fetchFiles();
      } else {
        const data = await res.json();
        alert(data.error || "خطا در انتقال فایل");
      }
    } catch (error) {
      console.error("Error moving file:", error);
      alert("خطا در انتقال فایل");
    }
  };

  const handleDelete = async (file: any) => {
    if (!confirm(`آیا از حذف "${file.name}" اطمینان دارید؟`)) return;

    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchFiles();
      } else {
        const data = await res.json();
        alert(data.error || "خطا در حذف فایل");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("خطا در حذف فایل");
    }
  };

  const handleReplace = async (file: any) => {
    alert("قابلیت جایگزینی فایل به زودی اضافه می‌شود");
    // TODO: Implement file replacement
  };

  const handleEditTags = async (file: any) => {
    const tagsStr = prompt(
      "تگ‌ها را با ویرگول جدا کنید:",
      file.tags.join(", ")
    );
    if (tagsStr === null) return;

    const newTags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);

    try {
      const res = await fetch(`/api/files/${file.id}/tags`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: newTags }),
      });

      if (res.ok) {
        fetchFiles();
      } else {
        const data = await res.json();
        alert(data.error || "خطا در ویرایش تگ‌ها");
      }
    } catch (error) {
      console.error("Error editing tags:", error);
      alert("خطا در ویرایش تگ‌ها");
    }
  };

  const handleRefresh = () => {
    fetchFolders();
    fetchFiles();
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (session?.user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              مدیریت فایل‌ها
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              فایل‌های سازمانی
            </p>
          </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"
              >
                <RefreshCw size={18} />
                <span className="hidden sm:inline">بروزرسانی</span>
              </button>
              <button
                onClick={() => router.push("/files/trash")}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"
              >
                <Trash2 size={18} />
                <span className="hidden sm:inline">سطل زباله</span>
              </button>
              <button
                onClick={() => setCreateFolderModalOpen(true)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2"
              >
                <FolderPlus size={18} />
                <span className="hidden sm:inline">پوشه جدید</span>
              </button>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
              >
                <Upload size={18} />
                <span className="hidden sm:inline">آپلود فایل</span>
              </button>
            </div>
          </div>

          {/* Breadcrumb */}
          <FolderBreadcrumb
            folders={breadcrumbFolders}
            onNavigate={handleFolderSelect}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Folder Tree */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                پوشه‌ها
              </h3>
              <FolderTreeView
                folders={folders}
                currentFolderId={currentFolderId}
                onFolderSelect={handleFolderSelect}
              />
            </div>

            {/* Tag Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <TagFilter
                selectedTags={selectedTags}
                onChange={setSelectedTags}
                projectId={null}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              {/* Toolbar */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {/* Search */}
                  <div className="relative flex-1 w-full sm:w-auto">
                    <Search
                      size={18}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="جستجو در فایل‌ها..."
                      className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded ${
                        viewMode === "list"
                          ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <List size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded ${
                        viewMode === "grid"
                          ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <Grid3x3 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* File List */}
              <div className="p-4">
                <FileList
                  files={files}
                  loading={loading}
                  onDownload={handleDownload}
                  onRename={handleRename}
                  onMove={handleMove}
                  onDelete={handleDelete}
                  onReplace={handleReplace}
                  onEditTags={handleEditTags}
                  onPreview={(file) => setPreviewFile(file)}
                  viewMode={viewMode}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      قبلی
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      صفحه {page} از {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      بعدی
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Modals */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        folderId={currentFolderId}
        projectId={null}
        suggestedTags={suggestedTags}
        onUploadComplete={handleUploadComplete}
      />

      <CreateFolderModal
        isOpen={createFolderModalOpen}
        onClose={() => setCreateFolderModalOpen(false)}
        parentFolderId={currentFolderId}
        projectId={null}
        onFolderCreated={handleFolderCreated}
      />

      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
        onDownload={handleDownload}
      />
    </div>
  );
}
