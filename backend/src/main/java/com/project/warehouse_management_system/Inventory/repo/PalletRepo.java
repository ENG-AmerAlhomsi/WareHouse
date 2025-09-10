package com.project.warehouse_management_system.Inventory.repo;

import com.project.warehouse_management_system.BaseClasses.BaseRepo;
import com.project.warehouse_management_system.Inventory.model.Pallet;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PalletRepo extends BaseRepo<Pallet,Long> {

    List<Pallet> getPalletsByProductId(Long productId);
}
