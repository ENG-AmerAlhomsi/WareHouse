package com.project.warehouse_management_system.WareHouseStructure.controller;

import com.project.warehouse_management_system.BaseClasses.BaseController;
import com.project.warehouse_management_system.WareHouseStructure.model.Bay;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("bays")
public class BayController extends BaseController<Bay,Long> {
}
