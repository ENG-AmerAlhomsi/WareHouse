package com.project.warehouse_management_system.Shipment.controller;

import com.project.warehouse_management_system.BaseClasses.BaseController;
import com.project.warehouse_management_system.Shipment.model.Shipment;
import com.project.warehouse_management_system.Shipment.service.ShipmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("shipments")
public class ShipmentController extends BaseController<Shipment,Long> {
    @Autowired
    private ShipmentService shipmentService;

    /**
     * Endpoint to get all shipments for a specific employee/user
     * @param userId The ID of the employee/user
     * @return List of shipments for the employee
     */
    @GetMapping("/employee/{userId}")
    public ResponseEntity<List<Shipment>> getShipmentsByEmployeeId(@PathVariable String userId) {
        List<Shipment> shipments = shipmentService.getShipmentsByEmployeeId(userId);
        return ResponseEntity.ok(shipments);
    }
}
