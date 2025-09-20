package com.project.warehouse_management_system.WareHouseStructure.controller;

import com.project.warehouse_management_system.BaseClasses.BaseController;
import com.project.warehouse_management_system.WareHouseStructure.model.Area;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("areas")
public class AreaController extends BaseController<Area,Long> {
}
