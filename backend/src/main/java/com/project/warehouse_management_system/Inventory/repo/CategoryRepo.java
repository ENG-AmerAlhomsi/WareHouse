package com.project.warehouse_management_system.Inventory.repo;

import com.project.warehouse_management_system.BaseClasses.BaseRepo;
import com.project.warehouse_management_system.Inventory.model.Category;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepo extends BaseRepo <Category,Long>{
}
