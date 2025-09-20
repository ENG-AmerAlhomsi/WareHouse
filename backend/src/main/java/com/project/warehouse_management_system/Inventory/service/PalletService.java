package com.project.warehouse_management_system.Inventory.service;

import com.project.warehouse_management_system.BaseClasses.BaseService;
import com.project.warehouse_management_system.Inventory.model.Product;
import com.project.warehouse_management_system.Inventory.repo.ProductRepo;
import com.project.warehouse_management_system.Inventory.model.Pallet;
import com.project.warehouse_management_system.Inventory.repo.PalletRepo;
import com.project.warehouse_management_system.WareHouseStructure.model.Position;
import com.project.warehouse_management_system.WareHouseStructure.repo.PositionRepo;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import jakarta.validation.ValidationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import com.project.warehouse_management_system.Inventory.controller.PalletController;

@Service
public class PalletService extends BaseService<Pallet,Long> {
    @Autowired
    private PalletRepo palletRepo;
    @Autowired
    private ProductRepo productRepo;
    @Autowired
    private PositionRepo positionRepo;


    @Override
    protected void setEntityId(Pallet entity, Long id) {
        entity.setId(id);
    }


    public  Pallet updatePalletOnly(Long id, Pallet entity) {
        // Verify the pallet exists
        palletRepo.findById(id).orElseThrow(
                () -> new EntityNotFoundException("Pallet not found with id: " + id)
        );
        setEntityId(entity,id);
        return palletRepo.save(entity);
    }

    @Override
    @Transactional
    public Pallet create(Pallet entity) {
        if (entity.getProduct() == null) {
            throw new ValidationException("Product must be specified for a Package entry.");
        }
        if(Objects.equals(entity.getStatus(), "stored")){
            if (entity.getPosition() == null) {
                throw new ValidationException("Position must be specified.");
            }
            // Fetch the position and mark it as not empty
            Position position = positionRepo.findById(entity.getPosition().getId())
                    .orElseThrow(() -> new ValidationException("Invalid position ID."));
            position.setIsEmpty(false);
            positionRepo.save(position);

            // Update product stock
            Product product = productRepo.findById(entity.getProduct().getId()).orElseThrow();
            product.setQuantityInStock(product.getQuantityInStock() + entity.getQuantity());
            productRepo.save(product);

            return palletRepo.save(entity);
        }

        return palletRepo.save(entity);
    }

    @Override
    public List<Pallet> createList(List<Pallet> pallets) {
        // Save all packages
        return null;
    }

    @Override
    @Transactional
    public Pallet update(Long palletId, Pallet updatedPallet) {
        Pallet existingPallet = palletRepo.findById(palletId).orElseThrow(
                () -> new EntityNotFoundException("Pallet not found with id: " + palletId)
        );

        Product product = productRepo.findById(existingPallet.getProduct().getId()).orElseThrow();

        // Backup old state
        String oldStatus = existingPallet.getStatus();
        String newStatus = updatedPallet.getStatus();
        boolean wasStored = oldStatus != null && oldStatus.equalsIgnoreCase("stored");
        boolean isNowStored = newStatus != null && newStatus.equalsIgnoreCase("stored");

        int oldQuantity = existingPallet.getQuantity();
        int newQuantity = updatedPallet.getQuantity();

        // Update pallet name and maximum capacity
        existingPallet.setPalletName(updatedPallet.getPalletName());
        existingPallet.setMaximumCapacity(updatedPallet.getMaximumCapacity());

        // Check max capacity
        if (newQuantity > updatedPallet.getMaximumCapacity()) {
            throw new ValidationException("Quantity exceeds maximum capacity.");
        }

        // Update product quantity if pallet status changed
        if (wasStored && !isNowStored) {
            // Pallet removed from stock
            product.setQuantityInStock(product.getQuantityInStock() - oldQuantity);
        } else if (!wasStored && isNowStored) {
            // Pallet added to stock
            product.setQuantityInStock(product.getQuantityInStock() + newQuantity);
        } else if (wasStored && isNowStored && oldQuantity != newQuantity) {
            // Pallet remained in stock but quantity changed
            int diff = newQuantity - oldQuantity;
            product.setQuantityInStock(product.getQuantityInStock() + diff);
        }
        productRepo.save(product);
        existingPallet.setQuantity(newQuantity);

        // Handle status change and unlink if removed from storage
        if (wasStored && !isNowStored && existingPallet.getPosition() != null) {
            Long oldPositionId = existingPallet.getPosition().getId();
            Position oldPosition = positionRepo.findById(oldPositionId).orElseThrow();
            oldPosition.setIsEmpty(true);
            positionRepo.save(oldPosition);
            existingPallet.setPosition(null);
        }

        existingPallet.setStatus(newStatus);

        // Handle position update if still stored
        if (isNowStored) {
            Long oldPositionId = existingPallet.getPosition() != null ? existingPallet.getPosition().getId() : null;
            Long newPositionId = updatedPallet.getPosition() != null ? updatedPallet.getPosition().getId() : null;

            if (newPositionId != null && !newPositionId.equals(oldPositionId)) {
                // Empty old position
                if (oldPositionId != null) {
                    Position oldPosition = positionRepo.findById(oldPositionId).orElseThrow();
                    oldPosition.setIsEmpty(true);
                    positionRepo.save(oldPosition);
                }

                // Occupy new position
                Position newPosition = positionRepo.findById(newPositionId)
                        .orElseThrow(() -> new ValidationException("New position ID is invalid."));
                newPosition.setIsEmpty(false);
                positionRepo.save(newPosition);
                existingPallet.setPosition(newPosition);
            }
        }

        return palletRepo.save(existingPallet);
    }



    @Override
    @Transactional
    public void delete(Long palletId) {
        // Retrieve the pallet to be deleted
        Pallet plt = palletRepo.findById(palletId).orElseThrow(
                () -> new EntityNotFoundException("pallet not found with id: " + palletId)
        );

        if (plt.getStatus() != null && Objects.equals(plt.getStatus(), "stored")){
            // Get the product associated with the package
            Product product = productRepo.findById(plt.getProduct().getId()).orElseThrow(
                    () -> new EntityNotFoundException("Product not found with id: " + plt.getProduct().getId())
            );

            // Adjust the quantity in stock for the product
            int newQuantity = product.getQuantityInStock() - plt.getQuantity();
            product.setQuantityInStock(Math.max(newQuantity, 0)); // Ensures quantity does not go below zero
            productRepo.save(product);

            // Fetch the position and mark it as empty
            Long positionId = plt.getPosition().getId();
            Position position = positionRepo.findById(positionId)
                    .orElseThrow(() -> new ValidationException("Invalid position ID."));
            position.setIsEmpty(true);
            positionRepo.save(position);
            // Delete the package
            palletRepo.delete(plt);}
        else {
            // Delete the package
            palletRepo.delete(plt);
        }


    }

    @Transactional
    public Pallet inspectPallet(Long palletId, PalletController.InspectionRequest inspectionRequest) {
        Pallet pallet = palletRepo.findById(palletId)
                .orElseThrow(() -> new EntityNotFoundException("Pallet not found with id: " + palletId));

        // If both quality and quantity are approved, mark as "Ready to Store"
        if (inspectionRequest.isQualityApproved() && inspectionRequest.isQuantityApproved()) {
            pallet.setStatus("Ready to Store");
        } else {
            pallet.setStatus("Inspection Failed");
        }

        // If quantity was adjusted (due to damage/shortage), update the quantity
        if (inspectionRequest.getAdjustedQuantity() > 0 && 
            inspectionRequest.getAdjustedQuantity() != pallet.getQuantity()) {
            pallet.setQuantity(inspectionRequest.getAdjustedQuantity());
        }

        return palletRepo.save(pallet);
    }

}

