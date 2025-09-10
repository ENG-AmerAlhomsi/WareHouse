package com.project.warehouse_management_system.Shipment.service;

import com.project.warehouse_management_system.BaseClasses.BaseService;
import com.project.warehouse_management_system.Inventory.model.Orders;
import com.project.warehouse_management_system.Inventory.repo.OrderRepo;
import com.project.warehouse_management_system.Shipment.model.Shipment;
import com.project.warehouse_management_system.Shipment.repo.ShipmentRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;

import java.util.List;

@Service
public class ShipmentService extends BaseService<Shipment,Long> {
    @Autowired
    private ShipmentRepo shipmentRepo;

    @Autowired
    private OrderRepo orderRepo;

    @Override
    protected void setEntityId(Shipment entity, Long id) {
        entity.setId(id);
    }

    /**
     * Find all shipments associated with a specific employee/user
     * @param userId The ID of the employee/user
     * @return List of shipments for the employee
     */
    @Cacheable(value = "employeeShipments", key = "#userId")
    public List<Shipment> getShipmentsByEmployeeId(String userId) {
        return shipmentRepo.findByShippingEmployee(userId);
    }

    /**
     * Override the create method to update orders' shipment field
     * @param shipment The shipment to create
     * @return The created shipment
     */
    @Override
    @Transactional
    public Shipment create(Shipment shipment) {
        // First, create the shipment
        Shipment createdShipment = super.create(shipment);

        // Update all orders in this shipment to reference the shipment ID
        if (createdShipment.getOrders() != null && !createdShipment.getOrders().isEmpty()) {
            for (Orders order : createdShipment.getOrders()) {
                // Set the shipment field to the shipment name
                order.setShipment(createdShipment.getId().toString());
                orderRepo.save(order);
            }
        }

        return createdShipment;
    }

}
