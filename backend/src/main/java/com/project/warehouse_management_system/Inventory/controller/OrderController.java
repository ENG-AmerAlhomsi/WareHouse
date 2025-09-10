package com.project.warehouse_management_system.Inventory.controller;

import com.project.warehouse_management_system.BaseClasses.BaseController;
import com.project.warehouse_management_system.BaseClasses.PaginatedResponse;
import com.project.warehouse_management_system.Inventory.model.Orders;
import com.project.warehouse_management_system.Inventory.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("order")
public class OrderController extends BaseController<Orders,Long> {

    @Autowired
    OrderService orderService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Orders>> getCustomerOrders(@PathVariable String userId) {
        List<Orders> orders = orderService.getCustomerOrders(userId);
        return new ResponseEntity<>(orders, HttpStatus.OK);
    }

    @GetMapping("/user/{userId}/paginated")
    public ResponseEntity<PaginatedResponse<Orders>> getCustomerOrdersPaginated(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        PaginatedResponse<Orders> response = orderService.getCustomerOrdersPaginated(userId, page, size, sortBy, sortDir);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/paginated")
    public ResponseEntity<PaginatedResponse<Orders>> getOrdersPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        PaginatedResponse<Orders> response = orderService.getOrdersPaginated(page, size, sortBy, sortDir);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    // Export endpoint - defined before the {id} endpoint to avoid path variable conflicts
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportOrders(@RequestParam(defaultValue = "csv") String format) {
        byte[] data = orderService.exportOrders(format);
        String filename = "orders-" + java.time.LocalDate.now() + "." + format.toLowerCase();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", filename);

        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }


    @PutMapping("/cancel/{id}")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        try {
            Orders canceledOrder = orderService.cancelOrder(id);
            return new ResponseEntity<>(canceledOrder, HttpStatus.OK);
        } catch (IllegalStateException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }


}
