package com.project.warehouse_management_system.WareHouse.controller;

import com.project.warehouse_management_system.BaseClasses.BaseController;
import com.project.warehouse_management_system.WareHouse.model.Location;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("location")
public class LocationController extends BaseController<Location,Long> {
}
