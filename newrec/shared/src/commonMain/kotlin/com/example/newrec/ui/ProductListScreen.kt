package com.example.newrec.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.newrec.Product
import com.example.newrec.ProductRepository

@Composable
fun ProductListScreen(
    products: List<Product>,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(8.dp),
            contentPadding = PaddingValues(bottom = 16.dp)
        ) {
            items(products, key = { it.id }) { product ->
                ProductCard(product = product)
            }
        }
    }
}

@Composable
fun App(productRepository: ProductRepository = remember { ProductRepository() }) {
    val products = remember { productRepository.loadProducts(productRepository.getSampleJson()) }
    
    MaterialTheme {
        ProductListScreen(products = products)
    }
}
