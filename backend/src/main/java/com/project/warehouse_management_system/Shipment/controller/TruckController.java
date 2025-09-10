package com.project.warehouse_management_system.Shipment.controller;

import com.project.warehouse_management_system.BaseClasses.BaseController;
import com.project.warehouse_management_system.Shipment.model.Truck;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("truck")
public class TruckController extends BaseController<Truck,Long> {
}
