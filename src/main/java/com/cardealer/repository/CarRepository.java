package com.cardealer.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cardealer.model.Car;

@Repository
public interface CarRepository extends JpaRepository<Car, Long> {

    List<Car> findByStatus(String status);

    List<Car> findByBrand(String brand);

    List<Car> findByCarModel(String carModel);
}
