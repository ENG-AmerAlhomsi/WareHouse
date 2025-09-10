package com.project.warehouse_management_system.WareHouse.controller;

import com.project.warehouse_management_system.BaseClasses.BaseController;
import com.project.warehouse_management_system.WareHouse.model.Position;
import com.project.warehouse_management_system.WareHouse.repo.PositionRepo;
import com.project.warehouse_management_system.WareHouse.service.PositionLabelPdfService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.io.IOException;

@RestController
@RequestMapping("positions")
public class PositionController extends BaseController<Position,Long> {

    @Autowired
    private PositionRepo positionRepo;

    @Autowired
    private PositionLabelPdfService pdfService;

    @GetMapping("/empty")
    public List<Position> getEmptyPositions() {
        return positionRepo.findByIsEmptyTrue();
    }

    @GetMapping("/labels/all")
    public ResponseEntity<byte[]> printAllLabels() throws IOException {
        List<Position> positions = positionRepo.findAll();
        byte[] pdf = pdfService.generateLabels(positions);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=positions-all.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/labels/new")
    public ResponseEntity<byte[]> printNewLabels() throws IOException {
        List<Position> positions = positionRepo.findByIsNewTrue();
        byte[] pdf = pdfService.generateLabels(positions);
        // mark all printed as not new
        for (Position p : positions) {
            p.setIsNew(false);
        }
        positionRepo.saveAll(positions);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=positions-new.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
