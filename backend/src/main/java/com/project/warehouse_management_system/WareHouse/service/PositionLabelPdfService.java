package com.project.warehouse_management_system.WareHouse.service;

import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.Color;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.project.warehouse_management_system.WareHouse.model.Position;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class PositionLabelPdfService {

    private BufferedImage generateQRCode(String text) {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        try {
            BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, 150, 150);
            return MatrixToImageWriter.toBufferedImage(bitMatrix);
        } catch (WriterException e) {
            return null;
        }
    }

    public byte[] generateLabels(List<Position> positions) throws IOException {
        float containerWidth = 400;
        float containerHeight = 200;
        PageSize pageSize = new PageSize(containerWidth, containerHeight);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        pdf.setDefaultPageSize(pageSize);
        Document document = new Document(pdf);

        for (Position position : positions) {
            String codeText = buildCode(position);
            document.add(createLabel(codeText));
            document.add(new AreaBreak());
        }

        document.close();
        return out.toByteArray();
    }

    private String buildCode(Position p) {
        String area = p.getBay() != null && p.getBay().getRow_sy() != null && p.getBay().getRow_sy().getArea() != null
                ? p.getBay().getRow_sy().getArea().getAreaName() : "";
        String row = p.getBay() != null && p.getBay().getRow_sy() != null ? p.getBay().getRow_sy().getRowName() : "";
        String bay = p.getBay() != null ? p.getBay().getBayName() : "";
        String level = String.valueOf(p.getLevel());
        String pos = p.getPositionName();
        return String.format("%s-%s-%s-%s-%s", area, row, bay, level, pos);
    }

    private Color backgroundForLevel(int level) {
        return switch (level) {
            case 1 -> new DeviceRgb(255, 255, 0);
            case 2 -> new DeviceRgb(222, 197, 227);
            case 3 -> new DeviceRgb(179, 212, 255);
            case 4 -> new DeviceRgb(200, 230, 201);
            case 5 -> new DeviceRgb(255, 205, 210);
            default -> ColorConstants.LIGHT_GRAY;
        };
    }

    private Div createLabel(String code) throws IOException {
        int level = extractLevel(code);
        Color backgroundColor = backgroundForLevel(level);

        BufferedImage qr = generateQRCode(code);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(qr, "png", baos);
        Image qrImage = new Image(ImageDataFactory.create(baos.toByteArray()))
                .setWidth(100)
                .setHeight(100);

        Paragraph header = new Paragraph("AREA"+"     "+"ROW"+"        "+"BAY"+"      "+"LEVEL"+"   "+"POS")
                .setBold()
                .setWidth(182)
                .setBackgroundColor(ColorConstants.WHITE)
                .setFontSize(9)
                .setTextAlignment(TextAlignment.JUSTIFIED)
                .setPaddingLeft(18);

        Paragraph value = new Paragraph(code)
                .setBold()
                .setWidth(200)
                .setBackgroundColor(ColorConstants.WHITE)
                .setFontSize(30);

        Table table = new Table(2);
        table.setWidth(300);
        table.addCell(new Cell().add(header).setBorder(Border.NO_BORDER));
        table.startNewRow();
        table.addCell(new Cell().add(value).setBorder(Border.NO_BORDER)).setTextAlignment(TextAlignment.CENTER);
        table.addCell(new Cell().add(qrImage).setBorder(Border.NO_BORDER));

        Div container = new Div();
        container.setBackgroundColor(backgroundColor);
        container.add(table);
        return container;
    }

    private int extractLevel(String code) {
        try {
            String[] parts = code.split("-");
            return Integer.parseInt(parts[3]);
        } catch (Exception ex) {
            return 1;
        }
    }
}


