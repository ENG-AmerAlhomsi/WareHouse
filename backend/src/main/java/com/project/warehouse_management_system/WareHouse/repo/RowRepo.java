package com.project.warehouse_management_system.WareHouse.repo;

import com.project.warehouse_management_system.BaseClasses.BaseRepo;
import com.project.warehouse_management_system.WareHouse.model.Row;
import org.springframework.stereotype.Repository;

@Repository
public interface RowRepo extends BaseRepo<Row,Long> {
}
