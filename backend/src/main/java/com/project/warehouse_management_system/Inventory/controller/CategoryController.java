package com.project.warehouse_management_system.Inventory.controller;

import com.project.warehouse_management_system.BaseClasses.BaseController;
import com.project.warehouse_management_system.Inventory.model.Category;
import com.project.warehouse_management_system.config.CacheInvalidationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("categories")
public class CategoryController extends BaseController<Category,Long> {
    
    @Autowired
    private CacheInvalidationService cacheInvalidationService;
    
   @Override
   @PostMapping("/create")
   public ResponseEntity<Category> createNew(@RequestBody Category entity) {
       ResponseEntity<Category> response = super.createNew(entity);

       // Invalidate both category and product caches since they're related
       cacheInvalidationService.invalidateCategoriesCache();
       cacheInvalidationService.invalidateProductsCache();

       return response;
   }

   @Override
   @PutMapping("/update/{id}")
   public ResponseEntity<Category> update(@PathVariable Long id, @RequestBody Category entity) {
       ResponseEntity<Category> response = super.update(id, entity);

       // Invalidate both category and product caches since they're related
       cacheInvalidationService.invalidateCategoriesCache();
       cacheInvalidationService.invalidateProductsCache();

       return response;
   }

   @Override
   @DeleteMapping("/delete/{id}")
   public ResponseEntity<Void> delete(@PathVariable Long id) {
       ResponseEntity<Void> response = super.delete(id);

       // Invalidate both category and product caches since they're related
       cacheInvalidationService.invalidateCategoriesCache();
       cacheInvalidationService.invalidateProductsCache();

       return response;
   }
}
