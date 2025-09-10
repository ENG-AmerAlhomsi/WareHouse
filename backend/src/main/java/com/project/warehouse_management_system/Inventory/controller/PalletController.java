package com.project.warehouse_management_system.Inventory.controller;

import com.project.warehouse_management_system.BaseClasses.BaseController;
import com.project.warehouse_management_system.Inventory.model.Pallet;
import com.project.warehouse_management_system.Inventory.repo.PalletRepo;
import com.project.warehouse_management_system.Inventory.service.PalletService;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("pallets")
public class PalletController extends BaseController<Pallet,Long> {

    @Autowired
    private PalletRepo palletRepo;

    @Autowired
    private PalletService palletService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Pallet>> getPalletsByProductId(@PathVariable Long productId) {
        List<Pallet> pallets = palletRepo.getPalletsByProductId(productId);
        return new ResponseEntity<>(pallets, HttpStatus.OK);
    }

    @PutMapping("/updatepalletonly/{id}")
    public ResponseEntity<Pallet> updatePalletOnly(@PathVariable Long id, @RequestBody Pallet entity){
        Pallet updated = palletService.updatePalletOnly(id, entity);
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    @PutMapping("/inspect/{id}")
    public ResponseEntity<Pallet> inspectPallet(
            @PathVariable Long id,
            @RequestBody InspectionRequest inspectionRequest) {
        try {
            Pallet inspectedPallet = palletService.inspectPallet(id, inspectionRequest);
            return ResponseEntity.ok(inspectedPallet);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // Inner class for inspection request
    @Setter
    @Getter
    public static class InspectionRequest {
        // Getters and setters
        private boolean qualityApproved;
        private boolean quantityApproved;
        private int adjustedQuantity;
        private String notes;

    }

}
