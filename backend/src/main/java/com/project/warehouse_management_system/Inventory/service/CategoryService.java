package com.project.warehouse_management_system.Inventory.service;

import com.project.warehouse_management_system.BaseClasses.BaseService;
import com.project.warehouse_management_system.Inventory.model.Category;
import org.springframework.stereotype.Service;

@Service
public class CategoryService extends BaseService<Category,Long> {
    @Override
    protected void setEntityId(Category entity, Long aLong) {
    }
}
