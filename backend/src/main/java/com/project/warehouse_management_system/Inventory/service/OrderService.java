package com.project.warehouse_management_system.Inventory.service;
import com.project.warehouse_management_system.BaseClasses.BaseService;
import com.project.warehouse_management_system.BaseClasses.PaginatedResponse;
import com.project.warehouse_management_system.Inventory.model.OrderProduct;
import com.project.warehouse_management_system.Inventory.model.Orders;
import com.project.warehouse_management_system.Inventory.model.Product;
import com.project.warehouse_management_system.Inventory.repo.OrderRepo;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService extends BaseService<Orders,Long> {
    @Autowired
    private OrderRepo orderRepository;
    @Autowired
    private ProductService productService;

    @Override
    protected void setEntityId(Orders entity, Long id) {

        entity.setId(id);}

    public List<Orders> getCustomerOrders(String userId) {
            return orderRepository.findByUserId(userId);}

    public PaginatedResponse<Orders> getCustomerOrdersPaginated(String userId, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.DESC.name()) ? 
            Sort.by(sortBy).descending() : 
            Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Orders> pageResult = orderRepository.findByUserIdPaginated(userId, pageable);
        
        return new PaginatedResponse<>(
            pageResult.getContent(),
            pageResult.getNumber(),
            pageResult.getSize(),
            pageResult.getTotalElements(),
            pageResult.getTotalPages(),
            pageResult.hasNext(),
            pageResult.hasPrevious()
        );
    }

    public PaginatedResponse<Orders> getCustomerOrdersPaginated(String userId, int page, int size) {
        return getCustomerOrdersPaginated(userId, page, size, "id", "desc");
    }

    public PaginatedResponse<Orders> getOrdersPaginated(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.DESC.name()) ? 
            Sort.by(sortBy).descending() : 
            Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Orders> pageResult = orderRepository.findAll(pageable);
        
        return new PaginatedResponse<>(
            pageResult.getContent(),
            pageResult.getNumber(),
            pageResult.getSize(),
            pageResult.getTotalElements(),
            pageResult.getTotalPages(),
            pageResult.hasNext(),
            pageResult.hasPrevious()
        );
    }

    public PaginatedResponse<Orders> getOrdersPaginated(int page, int size) {
        return getOrdersPaginated(page, size, "id", "desc");
    }

    @Override
    public Orders getById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Order ID cannot be null");
        }

        return orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Order not found with id: " + id));
    }

    @Transactional
    @Override
    public Orders create(Orders order) {
        // Update product stock quantities
        if (order.getProducts() != null && !order.getProducts().isEmpty()) {
            for (OrderProduct orderProduct : order.getProducts()) {
                // Skip if product is null
                if (orderProduct.getProduct() == null) {
                    throw new IllegalStateException("Order contains a product reference that is null");
                }

                Product product = orderProduct.getProduct();
                int quantityToDeduct = orderProduct.getQuantity();

                // Check if product exists in the database
                Product productFromDb = productService.getById(product.getId());
                if (productFromDb == null) {
                    throw new IllegalStateException("Product not found with ID: " + product.getId());
                }

                // Check if there's enough stock
                if (productFromDb.getQuantityInStock() < quantityToDeduct) {
                    throw new IllegalStateException("Not enough stock for product: " + productFromDb.getName() +
                            " (Available: " + productFromDb.getQuantityInStock() + ", Requested: " + quantityToDeduct + ")");
                }

                // Update stock
                productFromDb.setQuantityInStock(productFromDb.getQuantityInStock() - quantityToDeduct);
                productService.update(productFromDb.getId(), productFromDb);
            }
        }

        return orderRepository.save(order);
    }

    @Transactional
    @Override
    public Orders update(Long id, Orders updatedOrder) {
        Orders existingOrder = getById(id);

        // Handle product changes and stock updates if status is pending
        if ("Pending".equalsIgnoreCase(existingOrder.getStatus()) &&
                updatedOrder.getProducts() != null &&
                !updatedOrder.getProducts().isEmpty()) {

            // First, restore stock for products in the existing order
            if (existingOrder.getProducts() != null && !existingOrder.getProducts().isEmpty()) {
                for (OrderProduct orderProduct : existingOrder.getProducts()) {
                    // Skip if product is null
                    if (orderProduct.getProduct() == null) {
                        continue; // Skip this item, we can't restore stock for null products
                    }

                    Product product = orderProduct.getProduct();
                    int quantityToRestore = orderProduct.getQuantity();

                    try {
                        // Get product from database
                        Product productFromDb = productService.getById(product.getId());

                        // Restore stock
                        productFromDb.setQuantityInStock(productFromDb.getQuantityInStock() + quantityToRestore);
                        productService.update(productFromDb.getId(), productFromDb);
                    } catch (EntityNotFoundException e) {
                        // If product not found, log and continue
                        System.err.println("Cannot restore stock for deleted product: " + product.getId());
                    }
                }
            }

            // Then, deduct stock for products in the updated order
            for (OrderProduct orderProduct : updatedOrder.getProducts()) {
                // Skip if product is null
                if (orderProduct.getProduct() == null) {
                    throw new IllegalStateException("Order contains a product reference that is null");
                }

                Product product = orderProduct.getProduct();
                int quantityToDeduct = orderProduct.getQuantity();

                // Check if product exists in the database
                Product productFromDb = productService.getById(product.getId());
                if (productFromDb == null) {
                    throw new IllegalStateException("Product not found with ID: " + product.getId());
                }

                // Check if there's enough stock
                if (productFromDb.getQuantityInStock() < quantityToDeduct) {
                    throw new IllegalStateException("Not enough stock for product: " + productFromDb.getName() +
                            " (Available: " + productFromDb.getQuantityInStock() + ", Requested: " + quantityToDeduct + ")");
                }

                // Update stock
                productFromDb.setQuantityInStock(productFromDb.getQuantityInStock() - quantityToDeduct);
                productService.update(productFromDb.getId(), productFromDb);
            }

            existingOrder.setProducts(updatedOrder.getProducts());
        }

        // Update other fields
        existingOrder.setCustomer(updatedOrder.getCustomer());
        existingOrder.setDate(updatedOrder.getDate());
        existingOrder.setItems(updatedOrder.getItems());
        existingOrder.setValue(updatedOrder.getValue());

        // Only update status if it's not being changed to "Canceled"
        if (updatedOrder.getStatus() != null && !"Canceled".equalsIgnoreCase(updatedOrder.getStatus())) {
            existingOrder.setStatus(updatedOrder.getStatus());
        }

        existingOrder.setShipment(updatedOrder.getShipment());

        if (updatedOrder.getShippingAddress() != null) {
            existingOrder.setShippingAddress(updatedOrder.getShippingAddress());
        }

        if (updatedOrder.getPayment() != null) {
            existingOrder.setPayment(updatedOrder.getPayment());
        }

        return orderRepository.save(existingOrder);
    }

    @Transactional
    public Orders cancelOrder(Long id) {
        Orders order = getById(id);

        if (!"Pending".equalsIgnoreCase(order.getStatus())) {
            throw new IllegalStateException("Only orders with 'Pending' status can be canceled");
        }

        // Restore product stock quantities
        if (order.getProducts() != null && !order.getProducts().isEmpty()) {
            for (OrderProduct orderProduct : order.getProducts()) {
                Product product = orderProduct.getProduct();
                int quantityToRestore = orderProduct.getQuantity();

                // Restore stock
                product.setQuantityInStock(product.getQuantityInStock() + quantityToRestore);
                productService.update(product.getId(), product);
            }
        }

        order.setStatus("Canceled");
        return orderRepository.save(order);
    }

    public byte[] exportOrders(String format) {
            List<Orders> orders = getAll();

            if ("csv".equalsIgnoreCase(format)) {
                return exportOrdersToCSV(orders);
            } else {
                throw new UnsupportedOperationException("Export format not supported: " + format);
            }
        }

        private byte[] exportOrdersToCSV(List<Orders> orders) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

            try (
                    OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);
                    CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT
                            .withHeader("Order ID", "Customer", "Date", "Items", "Value", "Status",
                                    "Shipment", "Products", "Shipping Address", "Payment Last 4"))
            ) {
                for (Orders order : orders) {
                    String productsStr = order.getProducts() == null ? "" :
                            order.getProducts().stream()
                                    .map(op -> op.getProduct().getName() + " (x" + op.getQuantity() + ")")
                                    .collect(Collectors.joining(", "));

                    String address = order.getShippingAddress() == null ? "" :
                            order.getShippingAddress().getAddress() + ", " +
                                    order.getShippingAddress().getCity() + ", " +
                                    order.getShippingAddress().getState() + " " +
                                    order.getShippingAddress().getZipCode();

                    String paymentLast4 = order.getPayment() == null ? "" : order.getPayment().getLast4();

                    csvPrinter.printRecord(
                            order.getId(),
                            order.getCustomer(),
                            order.getDate() != null ? dateFormat.format(java.sql.Timestamp.valueOf(order.getDate().atStartOfDay())) : "",
                            order.getItems(),
                            order.getValue(),
                            order.getStatus(),
                            order.getShipment(),
                            productsStr,
                            address,
                            paymentLast4
                    );
                }

                csvPrinter.flush();
                return out.toByteArray();
            } catch (IOException e) {
                throw new RuntimeException("Failed to export orders to CSV", e);
            }
        }

    }

