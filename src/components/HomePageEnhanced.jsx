            韓国コスメブランドとクリエイターを繋ぐ新しいマーケティングプラットフォーム。
            あなたの創造性を収益化しませんか？
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100" asChild>
              <Link to="/signup">
                <Users className="h-5 w-5 mr-2" />
                クリエイター登録
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white bg-purple-600/20 hover:bg-white hover:text-purple-600 backdrop-blur-sm">
              <a href="#campaigns" className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                キャンペーンを見る
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {stats.totalCampaigns || 7}
              </div>
              <div className="text-gray-600">総キャンペーン数</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                3297+
              </div>
              <div className="text-gray-600">登録クリエイター数</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                28317+
              </div>
              <div className="text-gray-600">総応募数</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">
                ₩20,000,000+
              </div>
              <div className="text-gray-600">総報酬額</div>
            </div>
          </div>
        </div>
