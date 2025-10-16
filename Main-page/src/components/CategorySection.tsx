import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getProductsByCategory } from '../services/productService'
import { getCategoriesHierarchy } from '../services/categoryService'

const CategorySection: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await getCategoriesHierarchy()
        // 레벨1 카테고리만 가져오기 (상위 카테고리)
        const level1Categories = categoriesData.filter(cat => cat.level === 1)
        setCategories(level1Categories)
      } catch (error) {
        console.error('Error fetching categories:', error)
        // 에러 시 기본 카테고리 사용
        setCategories([
          { 
            id: 1,
            name: '여성 패션', 
            path: '/category/1', 
            image: 'https://image.thehyundai.com/HM/HM006/20250806/104045/pc_exclusive_stories.jpg' 
          },
          { 
            id: 2,
            name: '남성 패션', 
            path: '/category/2', 
            image: 'https://image.thehyundai.com/HM/HM006/20250805/132821/pc_exclusive.jpg' 
          },
          { 
            id: 3,
            name: '뷰티', 
            path: '/category/3', 
            image: 'https://image.thehyundai.com/HM/HM006/20250804/103547/pc_exclusive_stylein_3rd.jpg' 
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Categories</h2>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category) => (
            <div 
              key={category.id} 
              className="group cursor-pointer overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => window.location.href = `/category/${category.id}`}
            >
              <div 
                className="relative h-80 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                style={{ 
                  backgroundImage: `url(${category.image || 'https://image.thehyundai.com/HM/HM006/20250806/104045/pc_exclusive_stories.jpg'})` 
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                  <h3 className="text-2xl font-bold text-white text-center px-4">{category.name}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CategorySection