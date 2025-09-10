package com.project.warehouse_management_system.Inventory.controller;

import com.project.warehouse_management_system.BaseClasses.BaseController;
import com.project.warehouse_management_system.BaseClasses.PaginatedResponse;
import com.project.warehouse_management_system.Inventory.model.Product;
import com.project.warehouse_management_system.Inventory.service.ProductService;
import com.project.warehouse_management_system.config.CacheInvalidationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("products")
public class productController extends BaseController<Product,Long> {
    
    @Autowired
    private CacheInvalidationService cacheInvalidationService;
    
    @Autowired
    private ProductService productService;
    
    @GetMapping("/paginated")
    public ResponseEntity<PaginatedResponse<Product>> getProductsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        PaginatedResponse<Product> response = productService.getProductsPaginated(page, size, sortBy, sortDir);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
    
    @Override
    @PostMapping("/create")
    public ResponseEntity<Product> createNew(@RequestBody Product entity) {
        ResponseEntity<Product> response = super.createNew(entity);
        
        // Invalidate the products cache after creating a new product
        cacheInvalidationService.invalidateProductsCache();
        
        return response;
    }
    
    @Override
    @PutMapping("/update/{id}")
    public ResponseEntity<Product> update(@PathVariable Long id, @RequestBody Product entity) {
        ResponseEntity<Product> response = super.update(id, entity);
        
        // Invalidate the products cache after updating a product
        cacheInvalidationService.invalidateProductsCache();
        
        return response;
    }
    
    @Override
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        ResponseEntity<Void> response = super.delete(id);
        
        // Invalidate the products cache after deleting a product
        cacheInvalidationService.invalidateProductsCache();
        
        return response;
    }
}
