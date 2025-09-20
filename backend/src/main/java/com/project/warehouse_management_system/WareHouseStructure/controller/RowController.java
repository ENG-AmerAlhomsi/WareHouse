package com.project.warehouse_management_system.WareHouseStructure.controller;

import com.project.warehouse_management_system.BaseClasses.BaseController;
import com.project.warehouse_management_system.WareHouseStructure.model.Row;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("rows")
public class RowController extends BaseController<Row,Long> {
}
