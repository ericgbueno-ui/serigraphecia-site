import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";

export async function GET(req: Request) {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const drivers = await prisma.driver.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(drivers);
  } catch (error) {
    console.error("Erro ao buscar motoristas:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const updated = await prisma.driver.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar motorista:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const driver = await prisma.driver.create({
      data: {
        name: body.name || "",
        phone: body.phone || "",
        password: body.password || "123456",
        carModel: body.carModel || "N/D",
        carColor: body.carColor || "N/D",
        carYear: body.carYear || "N/D",
        carPlate: body.carPlate || "N/D",
        hybridOrElectric: body.hybridOrElectric || null,
        pixKey: body.pixKey || "N/D",
        cadastur: body.cadastur || "",
        companyType: body.companyType || "Autônomo",
        acceptedTerms: true,
        status: "APPROVED",
      },
    });

    return NextResponse.json(driver);
  } catch (error) {
    console.error("Erro ao cadastrar motorista manual:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
