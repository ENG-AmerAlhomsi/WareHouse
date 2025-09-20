package com.project.warehouse_management_system.WareHouseStructure.repo;

import com.project.warehouse_management_system.BaseClasses.BaseRepo;
import com.project.warehouse_management_system.WareHouseStructure.model.Location;
import org.springframework.stereotype.Repository;

@Repository
public interface LocationRepo extends BaseRepo<Location,Long> {
}
