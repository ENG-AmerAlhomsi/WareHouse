package com.project.warehouse_management_system.Inventory.repo;

import com.project.warehouse_management_system.BaseClasses.BaseRepo;
import com.project.warehouse_management_system.Inventory.model.Product;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepo extends BaseRepo<Product,Long> {
}
