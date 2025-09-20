package com.project.warehouse_management_system.WareHouseStructure.repo;

import com.project.warehouse_management_system.BaseClasses.BaseRepo;
import com.project.warehouse_management_system.WareHouseStructure.model.Row;
import org.springframework.stereotype.Repository;

@Repository
public interface RowRepo extends BaseRepo<Row,Long> {
}
