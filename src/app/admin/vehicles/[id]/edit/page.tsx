import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditVehicleForm from "./EditVehicleForm";
import ImageUpload from "./ImageUpload";
import DeleteVehicleButton from "../../DeleteVehicleButton";

export const dynamic = "force-dynamic";

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!vehicle) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-4">✏️ 编辑车辆</h1>
      <EditVehicleForm vehicle={vehicle} />
      <div className="mt-6">
        <ImageUpload vehicleId={vehicle.id} images={vehicle.images} />
      </div>
      <div className="mt-6 pt-4 border-t">
        <DeleteVehicleButton vehicleId={vehicle.id} />
      </div>
    </div>
  );
}
