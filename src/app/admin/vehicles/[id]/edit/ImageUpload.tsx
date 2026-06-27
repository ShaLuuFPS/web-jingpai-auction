"use client";

import { useState } from "react";

interface VehicleImage {
  id: string;
  filePath: string;
  sortOrder: number;
}

export default function ImageUpload({
  vehicleId,
  images,
}: {
  vehicleId: string;
  images: VehicleImage[];
}) {
  const [uploading, setUploading] = useState(false);
  const [imgList, setImgList] = useState(images);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);

    const form = new FormData();
    form.append("vehicleId", vehicleId);
    for (let i = 0; i < files.length; i++) {
      form.append("files", files[i]);
    }

    const res = await fetch("/api/admin/vehicles/images", { method: "POST", body: form });
    if (res.ok) {
      const newImages = await res.json();
      setImgList([...imgList, ...newImages]);
    }
    setUploading(false);
  };

  const handleDelete = async (imageId: string) => {
    await fetch(`/api/admin/vehicles/images?imageId=${imageId}`, { method: "DELETE" });
    setImgList(imgList.filter((i) => i.id !== imageId));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-semibold mb-3">📷 车辆照片</h3>
      <div className="flex flex-wrap gap-3 mb-4">
        {imgList.map((img) => (
          <div key={img.id} className="relative group">
            <img src={img.filePath} alt="" className="w-24 h-18 object-cover rounded" />
            <button
              onClick={() => handleDelete(img.id)}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <label className="inline-block bg-gray-100 hover:bg-gray-200 rounded px-4 py-2 text-sm cursor-pointer transition-colors">
        {uploading ? "上传中..." : "📤 上传照片"}
        <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" />
      </label>
    </div>
  );
}
