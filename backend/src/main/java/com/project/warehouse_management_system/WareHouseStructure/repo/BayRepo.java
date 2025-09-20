package com.project.warehouse_management_system.WareHouseStructure.repo;

import com.project.warehouse_management_system.BaseClasses.BaseRepo;
import com.project.warehouse_management_system.WareHouseStructure.model.Bay;
import org.springframework.stereotype.Repository;

@Repository
public interface BayRepo extends BaseRepo<Bay,Long> {
}
